import { z } from "zod";
import { eq, asc, and } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure, withRole } from "../trpc";
import { kbSections, kbArticles } from "@cargo/db";

export const knowledgebaseRouter = router({
  // Public: get all published sections with articles
  getPublished: publicProcedure.query(async ({ ctx }) => {
    const sections = await ctx.db
      .select()
      .from(kbSections)
      .where(eq(kbSections.is_published, true))
      .orderBy(asc(kbSections.sort_order));

    const articles = await ctx.db
      .select()
      .from(kbArticles)
      .where(eq(kbArticles.is_published, true))
      .orderBy(asc(kbArticles.sort_order));

    return sections.map((s) => ({
      ...s,
      articles: articles.filter((a) => a.section_id === s.id),
    }));
  }),

  // Admin: get all sections (including unpublished)
  listSections: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(kbSections).orderBy(asc(kbSections.sort_order));
  }),

  // Admin: get articles for a section
  listArticles: protectedProcedure
    .input(z.object({ sectionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(kbArticles)
        .where(eq(kbArticles.section_id, input.sectionId))
        .orderBy(asc(kbArticles.sort_order));
    }),

  // Admin: create section
  createSection: protectedProcedure
    .use(withRole("super_admin", "content_manager"))
    .input(
      z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        icon: z.string().optional(),
        sort_order: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [section] = await ctx.db
        .insert(kbSections)
        .values(input)
        .returning();
      return section;
    }),

  // Admin: update section
  updateSection: protectedProcedure
    .use(withRole("super_admin", "content_manager"))
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
        sort_order: z.number().optional(),
        is_published: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [section] = await ctx.db
        .update(kbSections)
        .set({ ...data, updated_at: new Date() })
        .where(eq(kbSections.id, id))
        .returning();
      return section;
    }),

  // Admin: delete section
  deleteSection: protectedProcedure
    .use(withRole("super_admin", "content_manager"))
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(kbSections).where(eq(kbSections.id, input.id));
      return { success: true };
    }),

  // Admin: create article
  createArticle: protectedProcedure
    .use(withRole("super_admin", "content_manager"))
    .input(
      z.object({
        section_id: z.string().uuid(),
        title: z.string().min(1),
        slug: z.string().min(1),
        content: z.string().min(1),
        sort_order: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [article] = await ctx.db
        .insert(kbArticles)
        .values({ ...input, created_by: ctx.admin?.id })
        .returning();
      return article;
    }),

  // Admin: update article
  updateArticle: protectedProcedure
    .use(withRole("super_admin", "content_manager"))
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        content: z.string().optional(),
        sort_order: z.number().optional(),
        is_published: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [article] = await ctx.db
        .update(kbArticles)
        .set({ ...data, updated_at: new Date() })
        .where(eq(kbArticles.id, id))
        .returning();
      return article;
    }),

  // Admin: delete article
  deleteArticle: protectedProcedure
    .use(withRole("super_admin", "content_manager"))
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(kbArticles).where(eq(kbArticles.id, input.id));
      return { success: true };
    }),
});
