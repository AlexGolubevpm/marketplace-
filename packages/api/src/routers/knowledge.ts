import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, asc, desc, and, inArray, sql, getTableColumns } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure, withRole } from "../trpc";
import {
  knowledgeCategories,
  knowledgeArticles,
  knowledgeTags,
  knowledgeArticleTags,
  knowledgeRedirects,
} from "@cargo/db";

// ── Zod schemas ────────────────────────────────────────────────────────────────
const faqItemSchema = z.object({ question: z.string(), answer: z.string() });
const sourceSchema = z.object({ title: z.string(), url: z.string() });

// ── Rate limiter for search ─────────────────────────────────────────────────────
const SEARCH_RATE_WINDOW = 60_000; // 1 minute
const SEARCH_RATE_MAX = 30; // max requests per window per IP
const searchBuckets = new Map<string, number[]>();

// Sweep stale buckets every 5 min to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, ts] of searchBuckets) {
    const recent = ts.filter((t) => now - t < SEARCH_RATE_WINDOW);
    if (recent.length === 0) searchBuckets.delete(ip);
    else searchBuckets.set(ip, recent);
  }
}, 5 * 60_000);

function checkSearchRate(ip: string): boolean {
  const now = Date.now();
  const timestamps = (searchBuckets.get(ip) ?? []).filter(
    (t) => now - t < SEARCH_RATE_WINDOW
  );
  if (timestamps.length >= SEARCH_RATE_MAX) return false;
  timestamps.push(now);
  searchBuckets.set(ip, timestamps);
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC PROCEDURES
// ═══════════════════════════════════════════════════════════════════════════════

export const knowledgeRouter = router({
  // ── Categories (public) ─────────────────────────────────────────────────────
  getCategories: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        ...getTableColumns(knowledgeCategories),
        article_count: sql<number>`count(${knowledgeArticles.id})`.mapWith(Number),
      })
      .from(knowledgeCategories)
      .leftJoin(
        knowledgeArticles,
        and(
          eq(knowledgeArticles.category_id, knowledgeCategories.id),
          eq(knowledgeArticles.status, "published")
        )
      )
      .where(eq(knowledgeCategories.is_active, true))
      .groupBy(knowledgeCategories.id)
      .orderBy(asc(knowledgeCategories.order));
  }),

  getCategoryBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const [category] = await ctx.db
        .select()
        .from(knowledgeCategories)
        .where(
          and(
            eq(knowledgeCategories.slug, input.slug),
            eq(knowledgeCategories.is_active, true)
          )
        )
        .limit(1);

      if (!category) return null;

      const articles = await ctx.db
        .select()
        .from(knowledgeArticles)
        .where(
          and(
            eq(knowledgeArticles.category_id, category.id),
            eq(knowledgeArticles.status, "published")
          )
        )
        .orderBy(asc(knowledgeArticles.sort_order));

      return { ...category, articles };
    }),

  // ── Articles (public) ───────────────────────────────────────────────────────
  getArticleBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const [article] = await ctx.db
        .select()
        .from(knowledgeArticles)
        .where(
          and(
            eq(knowledgeArticles.slug, input.slug),
            eq(knowledgeArticles.status, "published")
          )
        )
        .limit(1);

      if (!article) return null;

      // Parallel fetch: category, tags (single JOIN), related
      const [category, tags, related] = await Promise.all([
        article.category_id
          ? ctx.db
              .select()
              .from(knowledgeCategories)
              .where(eq(knowledgeCategories.id, article.category_id))
              .limit(1)
              .then((r) => r[0] ?? null)
          : Promise.resolve(null),

        ctx.db
          .select(getTableColumns(knowledgeTags))
          .from(knowledgeArticleTags)
          .innerJoin(knowledgeTags, eq(knowledgeTags.id, knowledgeArticleTags.tag_id))
          .where(eq(knowledgeArticleTags.article_id, article.id)),

        article.category_id
          ? ctx.db
              .select({
                id: knowledgeArticles.id,
                title: knowledgeArticles.title,
                slug: knowledgeArticles.slug,
                description: knowledgeArticles.description,
                published_at: knowledgeArticles.published_at,
              })
              .from(knowledgeArticles)
              .where(
                and(
                  eq(knowledgeArticles.category_id, article.category_id),
                  eq(knowledgeArticles.status, "published"),
                  sql`${knowledgeArticles.id} != ${article.id}`
                )
              )
              .orderBy(desc(knowledgeArticles.published_at))
              .limit(4)
          : Promise.resolve([]),
      ]);

      return { ...article, category, tags, related };
    }),

  // Check redirect for a given path
  getRedirect: publicProcedure
    .input(z.object({ path: z.string() }))
    .query(async ({ ctx, input }) => {
      const [redirect] = await ctx.db
        .select()
        .from(knowledgeRedirects)
        .where(eq(knowledgeRedirects.from_path, input.path))
        .limit(1);
      return redirect ?? null;
    }),

  // All redirects (for middleware pre-load)
  getAllRedirects: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(knowledgeRedirects);
  }),

  // Featured articles
  getFeatured: publicProcedure
    .input(z.object({ limit: z.number().default(6) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(knowledgeArticles)
        .where(
          and(
            eq(knowledgeArticles.status, "published"),
            eq(knowledgeArticles.is_featured, true)
          )
        )
        .orderBy(desc(knowledgeArticles.published_at))
        .limit(input.limit);
    }),

  // Articles by tag
  getByTag: publicProcedure
    .input(z.object({ tagSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const [tag] = await ctx.db
        .select()
        .from(knowledgeTags)
        .where(eq(knowledgeTags.slug, input.tagSlug))
        .limit(1);

      if (!tag) return null;

      const joins = await ctx.db
        .select({ article_id: knowledgeArticleTags.article_id })
        .from(knowledgeArticleTags)
        .where(eq(knowledgeArticleTags.tag_id, tag.id));

      const articles =
        joins.length > 0
          ? await ctx.db
              .select()
              .from(knowledgeArticles)
              .where(
                and(
                  inArray(
                    knowledgeArticles.id,
                    joins.map((j) => j.article_id)
                  ),
                  eq(knowledgeArticles.status, "published")
                )
              )
              .orderBy(desc(knowledgeArticles.published_at))
          : [];

      return { tag, articles };
    }),

  // All published articles (for sitemap)
  getAllPublished: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: knowledgeArticles.id,
        slug: knowledgeArticles.slug,
        updated_at: knowledgeArticles.updated_at,
        category_id: knowledgeArticles.category_id,
      })
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.status, "published"))
      .orderBy(desc(knowledgeArticles.published_at));
  }),

  // All FAQ items across published articles
  getAllFaq: publicProcedure.query(async ({ ctx }) => {
    const articles = await ctx.db
      .select({
        id: knowledgeArticles.id,
        title: knowledgeArticles.title,
        slug: knowledgeArticles.slug,
        faq_items: knowledgeArticles.faq_items,
      })
      .from(knowledgeArticles)
      .where(
        and(
          eq(knowledgeArticles.status, "published"),
          sql`${knowledgeArticles.faq_items} IS NOT NULL AND jsonb_array_length(${knowledgeArticles.faq_items}) > 0`
        )
      );
    return articles;
  }),

  // Search (rate-limited)
  search: publicProcedure
    .input(z.object({ q: z.string().min(1), limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const ip = ctx.clientIp ?? "unknown";
      if (!checkSearchRate(ip)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Слишком много запросов. Попробуйте через минуту.",
        });
      }
      const q = `%${input.q}%`;
      return ctx.db
        .select({
          id: knowledgeArticles.id,
          title: knowledgeArticles.title,
          slug: knowledgeArticles.slug,
          description: knowledgeArticles.description,
          category_id: knowledgeArticles.category_id,
        })
        .from(knowledgeArticles)
        .where(
          and(
            eq(knowledgeArticles.status, "published"),
            sql`(
              ${knowledgeArticles.title} ILIKE ${q}
              OR ${knowledgeArticles.description} ILIKE ${q}
              OR ${knowledgeArticles.content} ILIKE ${q}
            )`
          )
        )
        .limit(input.limit);
    }),

  // Tags (public)
  getTags: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(knowledgeTags)
      .orderBy(asc(knowledgeTags.title));
  }),

  // ── Categories (admin) ──────────────────────────────────────────────────────
  adminListCategories: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        ...getTableColumns(knowledgeCategories),
        article_count: sql<number>`count(${knowledgeArticles.id})`.mapWith(Number),
      })
      .from(knowledgeCategories)
      .leftJoin(
        knowledgeArticles,
        eq(knowledgeArticles.category_id, knowledgeCategories.id)
      )
      .groupBy(knowledgeCategories.id)
      .orderBy(asc(knowledgeCategories.order));
  }),

  adminCreateCategory: protectedProcedure
    .use(withRole("super_admin", "content_manager"))
    .input(
      z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        image_url: z.string().optional(),
        icon: z.string().optional(),
        order: z.number().default(0),
        is_active: z.boolean().default(true),
        meta_title: z.string().optional(),
        meta_description: z.string().optional(),
        canonical_override: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [cat] = await ctx.db
        .insert(knowledgeCategories)
        .values(input)
        .returning();
      ctx.revalidate?.("/knowledge", "layout");
      return cat;
    }),

  adminUpdateCategory: protectedProcedure
    .use(withRole("super_admin", "content_manager"))
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        description: z.string().optional(),
        image_url: z.string().optional(),
        icon: z.string().optional(),
        order: z.number().optional(),
        is_active: z.boolean().optional(),
        meta_title: z.string().optional(),
        meta_description: z.string().optional(),
        canonical_override: z.string().optional(),
        old_slug: z.string().optional(), // triggers redirect creation
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, old_slug, ...data } = input;

      // If slug changed, create redirect
      if (old_slug && data.slug && old_slug !== data.slug) {
        await ctx.db
          .insert(knowledgeRedirects)
          .values({
            from_path: `/knowledge/category/${old_slug}`,
            to_path: `/knowledge/category/${data.slug}`,
            status_code: 301,
          })
          .onConflictDoNothing();
      }

      const [cat] = await ctx.db
        .update(knowledgeCategories)
        .set({ ...data, updated_at: new Date() })
        .where(eq(knowledgeCategories.id, id))
        .returning();
      ctx.revalidate?.("/knowledge", "layout");
      return cat;
    }),

  adminDeleteCategory: protectedProcedure
    .use(withRole("super_admin", "content_manager"))
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(knowledgeCategories)
        .where(eq(knowledgeCategories.id, input.id));
      ctx.revalidate?.("/knowledge", "layout");
      return { success: true };
    }),

  // ── Articles (admin) ────────────────────────────────────────────────────────
  adminListArticles: protectedProcedure
    .input(z.object({ categoryId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      const conditions = input.categoryId
        ? [eq(knowledgeArticles.category_id, input.categoryId)]
        : [];

      return ctx.db
        .select()
        .from(knowledgeArticles)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(asc(knowledgeArticles.sort_order), desc(knowledgeArticles.updated_at));
    }),

  adminGetArticle: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [article] = await ctx.db
        .select()
        .from(knowledgeArticles)
        .where(eq(knowledgeArticles.id, input.id))
        .limit(1);

      if (!article) return null;

      const tagJoins = await ctx.db
        .select({ tag_id: knowledgeArticleTags.tag_id })
        .from(knowledgeArticleTags)
        .where(eq(knowledgeArticleTags.article_id, input.id));

      return { ...article, tag_ids: tagJoins.map((j) => j.tag_id) };
    }),

  adminCreateArticle: protectedProcedure
    .use(withRole("super_admin", "content_manager"))
    .input(
      z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        category_id: z.string().uuid().optional(),
        content: z.string().default(""),
        faq_items: z.array(faqItemSchema).default([]),
        sources: z.array(sourceSchema).default([]),
        status: z.enum(["draft", "published"]).default("draft"),
        author_name: z.string().optional(),
        reviewer_name: z.string().optional(),
        is_featured: z.boolean().default(false),
        canonical_override: z.string().optional(),
        redirects_from: z.array(z.string()).default([]),
        sort_order: z.number().default(0),
        tag_ids: z.array(z.string().uuid()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tag_ids, ...articleData } = input;

      const [article] = await ctx.db
        .insert(knowledgeArticles)
        .values({
          ...articleData,
          published_at:
            articleData.status === "published" ? new Date() : undefined,
        })
        .returning();

      if (tag_ids.length > 0) {
        await ctx.db.insert(knowledgeArticleTags).values(
          tag_ids.map((tid) => ({ article_id: article.id, tag_id: tid }))
        );
      }

      // Register any redirects_from paths
      if (articleData.redirects_from.length > 0) {
        for (const from of articleData.redirects_from) {
          await ctx.db
            .insert(knowledgeRedirects)
            .values({
              from_path: from,
              to_path: `/knowledge/${article.slug}`,
              status_code: 301,
            })
            .onConflictDoNothing();
        }
      }

      ctx.revalidate?.("/knowledge", "layout");
      return article;
    }),

  adminUpdateArticle: protectedProcedure
    .use(withRole("super_admin", "content_manager"))
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        description: z.string().optional(),
        category_id: z.string().uuid().nullable().optional(),
        content: z.string().optional(),
        faq_items: z.array(faqItemSchema).optional(),
        sources: z.array(sourceSchema).optional(),
        status: z.enum(["draft", "published"]).optional(),
        author_name: z.string().optional(),
        reviewer_name: z.string().optional(),
        is_featured: z.boolean().optional(),
        canonical_override: z.string().optional(),
        redirects_from: z.array(z.string()).optional(),
        sort_order: z.number().optional(),
        tag_ids: z.array(z.string().uuid()).optional(),
        old_slug: z.string().optional(), // triggers redirect
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, tag_ids, old_slug, ...data } = input;

      // Fetch current article to check status transition
      const [current] = await ctx.db
        .select({ status: knowledgeArticles.status, slug: knowledgeArticles.slug })
        .from(knowledgeArticles)
        .where(eq(knowledgeArticles.id, id))
        .limit(1);

      // Set published_at on first publish
      const extraFields: Record<string, unknown> = {};
      if (data.status === "published" && current?.status !== "published") {
        extraFields.published_at = new Date();
      }

      // If slug changed, create redirect
      if (old_slug && data.slug && old_slug !== data.slug) {
        await ctx.db
          .insert(knowledgeRedirects)
          .values({
            from_path: `/knowledge/${old_slug}`,
            to_path: `/knowledge/${data.slug}`,
            status_code: 301,
          })
          .onConflictDoNothing();
      }

      const [article] = await ctx.db
        .update(knowledgeArticles)
        .set({ ...data, ...extraFields, updated_at: new Date() })
        .where(eq(knowledgeArticles.id, id))
        .returning();

      // Update tags
      if (tag_ids !== undefined) {
        await ctx.db
          .delete(knowledgeArticleTags)
          .where(eq(knowledgeArticleTags.article_id, id));

        if (tag_ids.length > 0) {
          await ctx.db.insert(knowledgeArticleTags).values(
            tag_ids.map((tid) => ({ article_id: id, tag_id: tid }))
          );
        }
      }

      // Register additional redirects_from paths
      if (data.redirects_from && data.redirects_from.length > 0) {
        for (const from of data.redirects_from) {
          await ctx.db
            .insert(knowledgeRedirects)
            .values({
              from_path: from,
              to_path: `/knowledge/${article.slug}`,
              status_code: 301,
            })
            .onConflictDoNothing();
        }
      }

      ctx.revalidate?.("/knowledge", "layout");
      return article;
    }),

  adminDeleteArticle: protectedProcedure
    .use(withRole("super_admin", "content_manager"))
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(knowledgeArticles)
        .where(eq(knowledgeArticles.id, input.id));
      ctx.revalidate?.("/knowledge", "layout");
      return { success: true };
    }),

  // ── Tags (admin) ────────────────────────────────────────────────────────────
  adminListTags: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(knowledgeTags)
      .orderBy(asc(knowledgeTags.title));
  }),

  adminCreateTag: protectedProcedure
    .use(withRole("super_admin", "content_manager"))
    .input(
      z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        meta_title: z.string().optional(),
        meta_description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [tag] = await ctx.db
        .insert(knowledgeTags)
        .values(input)
        .returning();
      return tag;
    }),

  adminUpdateTag: protectedProcedure
    .use(withRole("super_admin", "content_manager"))
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        description: z.string().optional(),
        meta_title: z.string().optional(),
        meta_description: z.string().optional(),
        old_slug: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, old_slug, ...data } = input;

      if (old_slug && data.slug && old_slug !== data.slug) {
        await ctx.db
          .insert(knowledgeRedirects)
          .values({
            from_path: `/knowledge/tag/${old_slug}`,
            to_path: `/knowledge/tag/${data.slug}`,
            status_code: 301,
          })
          .onConflictDoNothing();
      }

      const [tag] = await ctx.db
        .update(knowledgeTags)
        .set({ ...data, updated_at: new Date() })
        .where(eq(knowledgeTags.id, id))
        .returning();
      return tag;
    }),

  adminDeleteTag: protectedProcedure
    .use(withRole("super_admin", "content_manager"))
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(knowledgeTags)
        .where(eq(knowledgeTags.id, input.id));
      return { success: true };
    }),

  // ── Redirects (admin) ───────────────────────────────────────────────────────
  adminListRedirects: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(knowledgeRedirects)
      .orderBy(desc(knowledgeRedirects.created_at));
  }),

  adminCreateRedirect: protectedProcedure
    .use(withRole("super_admin", "content_manager"))
    .input(
      z.object({
        from_path: z.string().min(1),
        to_path: z.string().min(1),
        status_code: z.number().default(301),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [redirect] = await ctx.db
        .insert(knowledgeRedirects)
        .values(input)
        .onConflictDoNothing()
        .returning();
      return redirect;
    }),

  adminDeleteRedirect: protectedProcedure
    .use(withRole("super_admin", "content_manager"))
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(knowledgeRedirects)
        .where(eq(knowledgeRedirects.id, input.id));
      return { success: true };
    }),
});
