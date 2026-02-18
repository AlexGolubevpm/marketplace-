/**
 * Server-side knowledge base queries — direct Drizzle access.
 * Only import from Server Components / Route Handlers.
 *
 * All queries are wrapped in try-catch so that `next build` succeeds
 * even when the database is unavailable (e.g. CI/CD, fresh deploy).
 * On the first real request ISR will populate the pages from the DB.
 */
import { eq, and, asc, desc, inArray, sql } from "drizzle-orm";
import {
  knowledgeCategories,
  knowledgeArticles,
  knowledgeTags,
  knowledgeArticleTags,
  knowledgeRedirects,
} from "@cargo/db";
import { db } from "./db";

export type KnowledgeCategory = typeof knowledgeCategories.$inferSelect & {
  article_count?: number;
};
export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;
export type KnowledgeTag = typeof knowledgeTags.$inferSelect;
export type KnowledgeRedirect = typeof knowledgeRedirects.$inferSelect;

// ── Categories ─────────────────────────────────────────────────────────────────
export async function getPublishedCategories(): Promise<KnowledgeCategory[]> {
  try {
    const categories = await db
      .select()
      .from(knowledgeCategories)
      .where(eq(knowledgeCategories.is_active, true))
      .orderBy(asc(knowledgeCategories.order));

    const counts = await db
      .select({
        category_id: knowledgeArticles.category_id,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.status, "published"))
      .groupBy(knowledgeArticles.category_id);

    const countMap = Object.fromEntries(counts.map((c) => [c.category_id, c.count]));
    return categories.map((cat) => ({ ...cat, article_count: countMap[cat.id] ?? 0 }));
  } catch (e) {
    console.warn("[knowledge] getPublishedCategories failed:", (e as Error).message);
    return [];
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    const [category] = await db
      .select()
      .from(knowledgeCategories)
      .where(
        and(
          eq(knowledgeCategories.slug, slug),
          eq(knowledgeCategories.is_active, true)
        )
      )
      .limit(1);

    if (!category) return null;

    const articles = await db
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
  } catch (e) {
    console.warn("[knowledge] getCategoryBySlug failed:", (e as Error).message);
    return null;
  }
}

// ── Articles ───────────────────────────────────────────────────────────────────
export async function getArticleBySlug(slug: string) {
  try {
    const [article] = await db
      .select()
      .from(knowledgeArticles)
      .where(
        and(
          eq(knowledgeArticles.slug, slug),
          eq(knowledgeArticles.status, "published")
        )
      )
      .limit(1);

    if (!article) return null;

    const category = article.category_id
      ? await db
          .select()
          .from(knowledgeCategories)
          .where(eq(knowledgeCategories.id, article.category_id))
          .limit(1)
          .then((r) => r[0] ?? null)
      : null;

    const tagJoins = await db
      .select({ tag_id: knowledgeArticleTags.tag_id })
      .from(knowledgeArticleTags)
      .where(eq(knowledgeArticleTags.article_id, article.id));

    const tags =
      tagJoins.length > 0
        ? await db
            .select()
            .from(knowledgeTags)
            .where(inArray(knowledgeTags.id, tagJoins.map((j) => j.tag_id)))
        : [];

    const related = article.category_id
      ? await db
          .select({
            id: knowledgeArticles.id,
            title: knowledgeArticles.title,
            slug: knowledgeArticles.slug,
            description: knowledgeArticles.description,
            published_at: knowledgeArticles.published_at,
            category_id: knowledgeArticles.category_id,
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
      : [];

    return { ...article, category, tags, related };
  } catch (e) {
    console.warn("[knowledge] getArticleBySlug failed:", (e as Error).message);
    return null;
  }
}

export async function getFeaturedArticles(limit = 6) {
  try {
    return await db
      .select()
      .from(knowledgeArticles)
      .where(
        and(
          eq(knowledgeArticles.status, "published"),
          eq(knowledgeArticles.is_featured, true)
        )
      )
      .orderBy(desc(knowledgeArticles.published_at))
      .limit(limit);
  } catch (e) {
    console.warn("[knowledge] getFeaturedArticles failed:", (e as Error).message);
    return [];
  }
}

export async function getAllPublishedArticles() {
  try {
    return await db
      .select({
        id: knowledgeArticles.id,
        slug: knowledgeArticles.slug,
        updated_at: knowledgeArticles.updated_at,
        category_id: knowledgeArticles.category_id,
      })
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.status, "published"))
      .orderBy(desc(knowledgeArticles.published_at));
  } catch (e) {
    console.warn("[knowledge] getAllPublishedArticles failed:", (e as Error).message);
    return [];
  }
}

// ── Tags ───────────────────────────────────────────────────────────────────────
export async function getTagBySlug(slug: string) {
  try {
    const [tag] = await db
      .select()
      .from(knowledgeTags)
      .where(eq(knowledgeTags.slug, slug))
      .limit(1);

    if (!tag) return null;

    const joins = await db
      .select({ article_id: knowledgeArticleTags.article_id })
      .from(knowledgeArticleTags)
      .where(eq(knowledgeArticleTags.tag_id, tag.id));

    const articles =
      joins.length > 0
        ? await db
            .select()
            .from(knowledgeArticles)
            .where(
              and(
                inArray(knowledgeArticles.id, joins.map((j) => j.article_id)),
                eq(knowledgeArticles.status, "published")
              )
            )
            .orderBy(desc(knowledgeArticles.published_at))
        : [];

    return { tag, articles };
  } catch (e) {
    console.warn("[knowledge] getTagBySlug failed:", (e as Error).message);
    return null;
  }
}

// ── FAQ ────────────────────────────────────────────────────────────────────────
export async function getAllFaqArticles() {
  try {
    return await db
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
          sql`jsonb_array_length(${knowledgeArticles.faq_items}) > 0`
        )
      );
  } catch (e) {
    console.warn("[knowledge] getAllFaqArticles failed:", (e as Error).message);
    return [];
  }
}

// ── Redirects ──────────────────────────────────────────────────────────────────
export async function getRedirect(fromPath: string) {
  try {
    const [redirect] = await db
      .select()
      .from(knowledgeRedirects)
      .where(eq(knowledgeRedirects.from_path, fromPath))
      .limit(1);
    return redirect ?? null;
  } catch (e) {
    console.warn("[knowledge] getRedirect failed:", (e as Error).message);
    return null;
  }
}

export async function getAllRedirects() {
  try {
    return await db.select().from(knowledgeRedirects);
  } catch (e) {
    console.warn("[knowledge] getAllRedirects failed:", (e as Error).message);
    return [];
  }
}

// ── Recent articles for hub ────────────────────────────────────────────────────
export async function getRecentArticles(limit = 8) {
  try {
    return await db
      .select({
        id: knowledgeArticles.id,
        title: knowledgeArticles.title,
        slug: knowledgeArticles.slug,
        description: knowledgeArticles.description,
        category_id: knowledgeArticles.category_id,
        published_at: knowledgeArticles.published_at,
      })
      .from(knowledgeArticles)
      .where(eq(knowledgeArticles.status, "published"))
      .orderBy(desc(knowledgeArticles.published_at))
      .limit(limit);
  } catch (e) {
    console.warn("[knowledge] getRecentArticles failed:", (e as Error).message);
    return [];
  }
}
