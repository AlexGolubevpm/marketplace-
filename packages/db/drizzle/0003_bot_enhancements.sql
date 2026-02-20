-- Bot enhancements: model params, skills, webhook, logs

-- New columns for bot_configs
ALTER TABLE "bot_configs"
  ADD COLUMN IF NOT EXISTS "max_tokens" integer,
  ADD COLUMN IF NOT EXISTS "temperature" real,
  ADD COLUMN IF NOT EXISTS "skills" jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "webhook_url" varchar(500);

-- Enum for log direction
DO $$ BEGIN
  CREATE TYPE "bot_log_direction" AS ENUM ('in', 'out');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Bot message logs table
CREATE TABLE IF NOT EXISTS "bot_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "bot_id" uuid NOT NULL REFERENCES "bot_configs"("id") ON DELETE CASCADE,
  "direction" "bot_log_direction" NOT NULL,
  "text" text NOT NULL,
  "telegram_user_id" varchar(50),
  "telegram_username" varchar(100),
  "meta" jsonb DEFAULT '{}',
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "bot_logs_bot_id_idx" ON "bot_logs" ("bot_id");
CREATE INDEX IF NOT EXISTS "bot_logs_created_at_idx" ON "bot_logs" ("created_at" DESC);
