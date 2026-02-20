import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  integer,
  real,
} from "drizzle-orm/pg-core";

export const botStatusEnum = pgEnum("bot_status", [
  "active",
  "disabled",
  "error",
]);

export const botConfigs = pgTable("bot_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  description: text("description"),
  is_enabled: boolean("is_enabled").notNull().default(true),
  status: botStatusEnum("bot_status").notNull().default("active"),

  // Telegram
  telegram_bot_token: text("telegram_bot_token"),
  telegram_bot_username: varchar("telegram_bot_username", { length: 100 }),

  // Model config
  openrouter_api_key: text("openrouter_api_key"),
  model_primary: varchar("model_primary", { length: 200 })
    .notNull()
    .default("openrouter/deepseek/deepseek-r1-0528"),
  model_fallbacks: jsonb("model_fallbacks").$type<string[]>().default([]),
  max_tokens: integer("max_tokens"),
  temperature: real("temperature"),

  // Prompt files content
  soul_md: text("soul_md"),
  agents_md: text("agents_md"),

  // Skills (list of skill JS file contents)
  skills: jsonb("skills")
    .$type<{ name: string; description: string; triggers: string[]; code: string }[]>()
    .default([]),

  // OpenClaw config
  heartbeat_interval: varchar("heartbeat_interval", { length: 20 }),
  extra_env: jsonb("extra_env").$type<Record<string, string>>().default({}),

  // Webhook
  webhook_url: varchar("webhook_url", { length: 500 }),

  // Deploy state
  last_deployed_at: timestamp("last_deployed_at"),
  deploy_error: text("deploy_error"),

  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const botLogDirectionEnum = pgEnum("bot_log_direction", ["in", "out"]);

export const botLogs = pgTable("bot_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  bot_id: uuid("bot_id")
    .notNull()
    .references(() => botConfigs.id, { onDelete: "cascade" }),
  direction: botLogDirectionEnum("direction").notNull(),
  text: text("text").notNull(),
  telegram_user_id: varchar("telegram_user_id", { length: 50 }),
  telegram_username: varchar("telegram_username", { length: 100 }),
  meta: jsonb("meta").$type<Record<string, any>>().default({}),
  created_at: timestamp("created_at").notNull().defaultNow(),
});
