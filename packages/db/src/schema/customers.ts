import { pgTable, uuid, varchar, text, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";

export const customerStatusEnum = pgEnum("customer_status", [
  "active",
  "banned",
  "inactive",
]);

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegram_id: varchar("telegram_id", { length: 255 }).unique(),
  telegram_username: varchar("telegram_username", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }).unique(),
  password_hash: varchar("password_hash", { length: 255 }),
  full_name: varchar("full_name", { length: 255 }),
  company_name: varchar("company_name", { length: 255 }),
  avatar_url: varchar("avatar_url", { length: 500 }),
  status: customerStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
  // OAuth providers
  google_id: varchar("google_id", { length: 255 }).unique(),
  yandex_id: varchar("yandex_id", { length: 255 }).unique(),
  // Email verification
  email_verified: boolean("email_verified").notNull().default(false),
  email_verify_token: varchar("email_verify_token", { length: 255 }),
  email_verify_expires: timestamp("email_verify_expires"),
  // Password reset
  reset_token: varchar("reset_token", { length: 255 }),
  reset_token_expires: timestamp("reset_token_expires"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});
