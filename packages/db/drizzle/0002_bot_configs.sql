-- Bot configs management table
DO $$ BEGIN
  CREATE TYPE "bot_status" AS ENUM ('active', 'disabled', 'error');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "bot_configs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(100) NOT NULL,
  "slug" varchar(50) NOT NULL UNIQUE,
  "description" text,
  "is_enabled" boolean NOT NULL DEFAULT true,
  "bot_status" "bot_status" NOT NULL DEFAULT 'active',
  "telegram_bot_token" text,
  "telegram_bot_username" varchar(100),
  "openrouter_api_key" text,
  "model_primary" varchar(200) NOT NULL DEFAULT 'openrouter/deepseek/deepseek-r1-0528',
  "model_fallbacks" jsonb DEFAULT '[]',
  "soul_md" text,
  "agents_md" text,
  "heartbeat_interval" varchar(20),
  "extra_env" jsonb DEFAULT '{}',
  "last_deployed_at" timestamp,
  "deploy_error" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
