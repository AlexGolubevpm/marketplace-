-- Remove OpenClaw bot management tables
DROP TABLE IF EXISTS "bot_logs" CASCADE;
DROP TABLE IF EXISTS "bot_configs" CASCADE;
DROP TYPE IF EXISTS "bot_status" CASCADE;
DROP TYPE IF EXISTS "bot_log_direction" CASCADE;
