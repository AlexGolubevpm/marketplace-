import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, protectedProcedure, withRole } from "../trpc";
import { botConfigs, botLogs } from "@cargo/db";

const skillSchema = z.object({
  name: z.string(),
  description: z.string(),
  triggers: z.array(z.string()),
  code: z.string(),
});

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
  max_tokens: z.number().int().min(1).max(200000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  soul_md: z.string().optional(),
  agents_md: z.string().optional(),
  skills: z.array(skillSchema).default([]),
  heartbeat_interval: z.string().optional(),
  extra_env: z.record(z.string()).default({}),
  webhook_url: z.string().url().optional(),
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
  max_tokens: z.number().int().min(1).max(200000).nullable().optional(),
  temperature: z.number().min(0).max(2).nullable().optional(),
  soul_md: z.string().optional(),
  agents_md: z.string().optional(),
  skills: z.array(skillSchema).optional(),
  heartbeat_interval: z.string().optional(),
  extra_env: z.record(z.string()).optional(),
  webhook_url: z.string().url().optional().nullable(),
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

      const modelConfig: any = {
        primary: bot.model_primary,
        ...(bot.model_fallbacks && (bot.model_fallbacks as string[]).length > 0
          ? { fallbacks: bot.model_fallbacks }
          : {}),
        ...(bot.max_tokens ? { maxTokens: bot.max_tokens } : {}),
        ...(bot.temperature != null ? { temperature: bot.temperature } : {}),
      };

      const skills = (bot.skills as any[]) || [];

      const config: any = {
        channels: {
          telegram: {
            enabled: true,
            botToken: "${TELEGRAM_BOT_TOKEN}",
          },
        },
        agents: {
          defaults: {
            model: modelConfig,
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
        ...(skills.length > 0
          ? {
              skills: skills.map((s) => ({
                name: s.name,
                description: s.description,
                triggers: s.triggers,
              })),
            }
          : {}),
      };

      // Generate skill files content
      const skillFiles = skills.map((s) => ({
        filename: `${s.name}.js`,
        code: s.code,
      }));

      return {
        openclawJson: JSON.stringify(config, null, 2),
        soulMd: bot.soul_md || "",
        agentsMd: bot.agents_md || "",
        skillFiles,
      };
    }),

  // Set Telegram webhook via Bot API
  setWebhook: protectedProcedure
    .use(withRole("super_admin"))
    .input(z.object({ id: z.string().uuid(), webhook_url: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const [bot] = await ctx.db
        .select({
          telegram_bot_token: botConfigs.telegram_bot_token,
        })
        .from(botConfigs)
        .where(eq(botConfigs.id, input.id));
      if (!bot) throw new Error("Bot not found");
      if (!bot.telegram_bot_token) throw new Error("Telegram Bot Token не настроен");

      const url = `https://api.telegram.org/bot${bot.telegram_bot_token}/setWebhook`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input.webhook_url }),
      });
      const data = await res.json() as { ok: boolean; description?: string };
      if (!data.ok) {
        throw new Error(data.description || "Telegram API error");
      }

      // Save webhook_url
      await ctx.db
        .update(botConfigs)
        .set({ webhook_url: input.webhook_url, updated_at: new Date() } as any)
        .where(eq(botConfigs.id, input.id));

      return { ok: true };
    }),

  // Get current webhook info from Telegram
  getWebhookInfo: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [bot] = await ctx.db
        .select({ telegram_bot_token: botConfigs.telegram_bot_token })
        .from(botConfigs)
        .where(eq(botConfigs.id, input.id));
      if (!bot?.telegram_bot_token) return null;

      const url = `https://api.telegram.org/bot${bot.telegram_bot_token}/getWebhookInfo`;
      const res = await fetch(url);
      const data = await res.json() as { ok: boolean; result?: any };
      if (!data.ok) return null;
      return data.result as {
        url: string;
        has_custom_certificate: boolean;
        pending_update_count: number;
        last_error_message?: string;
        last_error_date?: number;
      };
    }),

  // Logs
  getLogs: protectedProcedure
    .input(
      z.object({
        bot_id: z.string().uuid(),
        limit: z.number().int().min(1).max(200).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(botLogs)
        .where(eq(botLogs.bot_id, input.bot_id))
        .orderBy(desc(botLogs.created_at))
        .limit(input.limit);
    }),

  addLog: protectedProcedure
    .input(
      z.object({
        bot_id: z.string().uuid(),
        direction: z.enum(["in", "out"]),
        text: z.string(),
        telegram_user_id: z.string().optional(),
        telegram_username: z.string().optional(),
        meta: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [log] = await ctx.db
        .insert(botLogs)
        .values(input as any)
        .returning();
      return log;
    }),

  clearLogs: protectedProcedure
    .use(withRole("super_admin"))
    .input(z.object({ bot_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(botLogs)
        .where(eq(botLogs.bot_id, input.bot_id));
      return { ok: true };
    }),
});
