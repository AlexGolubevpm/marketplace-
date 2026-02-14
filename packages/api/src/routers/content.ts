import { z } from "zod";
import { eq, and, sql, desc, max } from "drizzle-orm";
import { router, protectedProcedure, withRole } from "../trpc";
import { landingContent } from "@cargo/db";
import { landingContentUpdateSchema } from "@cargo/shared";

export const contentRouter = router({
  getSections: protectedProcedure.query(async ({ ctx }) => {
    // Get latest published version of each section
    const sections = await ctx.db
      .select()
      .from(landingContent)
      .where(eq(landingContent.is_published, true))
      .orderBy(desc(landingContent.created_at));

    // Deduplicate by section (keep latest published)
    const seen = new Set<string>();
    return sections.filter((s) => {
      if (seen.has(s.section)) return false;
      seen.add(s.section);
      return true;
    });
  }),

  getSection: protectedProcedure
    .input(z.object({ section: z.string() }))
    .query(async ({ ctx, input }) => {
      const [content] = await ctx.db
        .select()
        .from(landingContent)
        .where(
          and(
            eq(landingContent.section, input.section),
            eq(landingContent.is_published, true)
          )
        )
        .orderBy(desc(landingContent.version))
        .limit(1);

      return content || null;
    }),

  update: protectedProcedure
    .use(withRole("super_admin", "content_manager"))
    .input(landingContentUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      // Get max version for this section
      const [maxVer] = await ctx.db
        .select({ maxVersion: sql<number>`COALESCE(max(${landingContent.version}), 0)::int` })
        .from(landingContent)
        .where(eq(landingContent.section, input.section));

      const newVersion = (maxVer?.maxVersion ?? 0) + 1;

      const [content] = await ctx.db
        .insert(landingContent)
        .values({
          section: input.section,
          content: input.content,
          version: newVersion,
          is_published: false,
        })
        .returning();

      return content;
    }),

  publish: protectedProcedure
    .use(withRole("super_admin", "content_manager"))
    .input(z.object({ section: z.string(), version: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Unpublish all versions of this section
      await ctx.db
        .update(landingContent)
        .set({ is_published: false })
        .where(eq(landingContent.section, input.section));

      // Publish the specified version
      const [content] = await ctx.db
        .update(landingContent)
        .set({
          is_published: true,
          published_by: ctx.admin?.id,
        })
        .where(
          and(
            eq(landingContent.section, input.section),
            eq(landingContent.version, input.version)
          )
        )
        .returning();

      return content;
    }),

  getVersions: protectedProcedure
    .input(z.object({ section: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(landingContent)
        .where(eq(landingContent.section, input.section))
        .orderBy(desc(landingContent.version));
    }),

  revert: protectedProcedure
    .use(withRole("super_admin", "content_manager"))
    .input(z.object({ section: z.string(), version: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Same as publish - set the specified version as published
      await ctx.db
        .update(landingContent)
        .set({ is_published: false })
        .where(eq(landingContent.section, input.section));

      const [content] = await ctx.db
        .update(landingContent)
        .set({
          is_published: true,
          published_by: ctx.admin?.id,
        })
        .where(
          and(
            eq(landingContent.section, input.section),
            eq(landingContent.version, input.version)
          )
        )
        .returning();

      return content;
    }),
});
