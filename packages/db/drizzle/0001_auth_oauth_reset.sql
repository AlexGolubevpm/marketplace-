-- Migration: Add OAuth providers, email verification, and password reset to customers
-- Apply manually: psql $DATABASE_URL -f drizzle/0001_auth_oauth_reset.sql

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS google_id varchar(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS yandex_id varchar(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verify_token varchar(255),
  ADD COLUMN IF NOT EXISTS email_verify_expires timestamp,
  ADD COLUMN IF NOT EXISTS reset_token varchar(255),
  ADD COLUMN IF NOT EXISTS reset_token_expires timestamp;
