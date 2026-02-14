import { pgTable, uuid, varchar, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const customerStatusEnum = pgEnum("customer_status", [
  "active",
  "banned",
  "inactive",
]);

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegram_id: varchar("telegram_id", { length: 255 }).notNull().unique(),
  telegram_username: varchar("telegram_username", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  full_name: varchar("full_name", { length: 255 }),
  company_name: varchar("company_name", { length: 255 }),
  status: customerStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});
