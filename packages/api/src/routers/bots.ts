import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, protectedProcedure, withRole } from "../trpc";
import { botConfigs } from "@cargo/db";

const botCreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  is_enabled: z.boolean().default(true),
  telegram_bot_token: z.string().optional(),
  telegram_bot_username: z.string().optional(),
  openrouter_api_key: z.string().optional(),
  model_primary: z.string().default("openrouter/deepseek/deepseek-r1-0528"),
  model_fallbacks: z.array(z.string()).default([]),
  soul_md: z.string().optional(),
  agents_md: z.string().optional(),
  heartbeat_interval: z.string().optional(),
  extra_env: z.record(z.string()).default({}),
});

const botUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  is_enabled: z.boolean().optional(),
  status: z.enum(["active", "disabled", "error"]).optional(),
  telegram_bot_token: z.string().optional(),
  telegram_bot_username: z.string().optional(),
  openrouter_api_key: z.string().optional(),
  model_primary: z.string().optional(),
  model_fallbacks: z.array(z.string()).optional(),
  soul_md: z.string().optional(),
  agents_md: z.string().optional(),
  heartbeat_interval: z.string().optional(),
  extra_env: z.record(z.string()).optional(),
});

export const botsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(botConfigs)
      .orderBy(desc(botConfigs.created_at));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [bot] = await ctx.db
        .select()
        .from(botConfigs)
        .where(eq(botConfigs.id, input.id));
      if (!bot) {
        throw new Error("Bot not found");
      }
      return bot;
    }),

  create: protectedProcedure
    .use(withRole("super_admin"))
    .input(botCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const [bot] = await ctx.db
        .insert(botConfigs)
        .values(input as any)
        .returning();
      return bot;
    }),

  update: protectedProcedure
    .use(withRole("super_admin"))
    .input(botUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const filtered = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined)
      );
      const [bot] = await ctx.db
        .update(botConfigs)
        .set({ ...filtered, updated_at: new Date() } as any)
        .where(eq(botConfigs.id, id))
        .returning();
      return bot;
    }),

  delete: protectedProcedure
    .use(withRole("super_admin"))
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [bot] = await ctx.db
        .delete(botConfigs)
        .where(eq(botConfigs.id, input.id))
        .returning();
      return bot;
    }),

  toggleEnabled: protectedProcedure
    .use(withRole("super_admin"))
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ is_enabled: botConfigs.is_enabled })
        .from(botConfigs)
        .where(eq(botConfigs.id, input.id));
      if (!existing) throw new Error("Bot not found");

      const [bot] = await ctx.db
        .update(botConfigs)
        .set({
          is_enabled: !existing.is_enabled,
          updated_at: new Date(),
        })
        .where(eq(botConfigs.id, input.id))
        .returning();
      return bot;
    }),

  // Generate openclaw.json content from bot config
  generateConfig: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [bot] = await ctx.db
        .select()
        .from(botConfigs)
        .where(eq(botConfigs.id, input.id));
      if (!bot) throw new Error("Bot not found");

      const config: any = {
        channels: {
          telegram: {
            enabled: true,
            botToken: "${TELEGRAM_BOT_TOKEN}",
          },
        },
        agents: {
          defaults: {
            model: {
              primary: bot.model_primary,
              ...(bot.model_fallbacks && (bot.model_fallbacks as string[]).length > 0
                ? { fallbacks: bot.model_fallbacks }
                : {}),
            },
            ...(bot.heartbeat_interval
              ? {
                  heartbeat: {
                    every: bot.heartbeat_interval,
                    target: "last",
                  },
                }
              : {}),
          },
        },
      };

      return {
        openclawJson: JSON.stringify(config, null, 2),
        soulMd: bot.soul_md || "",
        agentsMd: bot.agents_md || "",
      };
    }),
});
