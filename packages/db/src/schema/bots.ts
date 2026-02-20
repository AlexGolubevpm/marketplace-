import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
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

  // Prompt files content
  soul_md: text("soul_md"),
  agents_md: text("agents_md"),

  // OpenClaw config
  heartbeat_interval: varchar("heartbeat_interval", { length: 20 }),
  extra_env: jsonb("extra_env").$type<Record<string, string>>().default({}),

  // Deploy state
  last_deployed_at: timestamp("last_deployed_at"),
  deploy_error: text("deploy_error"),

  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});
