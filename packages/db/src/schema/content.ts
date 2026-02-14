import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { admins } from "./admins";

export const landingContent = pgTable("landing_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  section: varchar("section", { length: 100 }).notNull(),
  content: jsonb("content").notNull(),
  version: integer("version").notNull().default(1),
  is_published: boolean("is_published").notNull().default(false),
  published_by: uuid("published_by").references(() => admins.id),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const slaSeverityEnum = pgEnum("sla_severity", ["warning", "critical"]);

export const slaConfigs = pgTable("sla_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  metric: varchar("metric", { length: 100 }).notNull(),
  threshold_value: decimal("threshold_value", { precision: 10, scale: 2 }).notNull(),
  threshold_unit: varchar("threshold_unit", { length: 20 }).notNull(),
  severity: slaSeverityEnum("severity").notNull(),
  is_active: boolean("is_active").notNull().default(true),
});
