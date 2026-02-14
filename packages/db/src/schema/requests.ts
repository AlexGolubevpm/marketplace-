import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  decimal,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { carriers } from "./carriers";
import { admins } from "./admins";

export const cargoTypeEnum = pgEnum("cargo_type", [
  "general",
  "fragile",
  "dangerous",
  "perishable",
  "oversized",
]);

export const deliveryPreferenceEnum = pgEnum("delivery_preference", [
  "air",
  "sea",
  "rail",
  "road",
  "any",
]);

export const requestStatusEnum = pgEnum("request_status", [
  "new",
  "matching",
  "offers_received",
  "offer_selected",
  "expired",
  "closed",
  "cancelled",
  "duplicate",
  "resubmitted",
]);

export const requestSourceEnum = pgEnum("request_source", [
  "telegram_bot",
  "web_form",
  "admin_manual",
  "api",
]);

export const requests = pgTable("requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  display_id: varchar("display_id", { length: 20 }).notNull().unique(),
  customer_id: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  origin_country: varchar("origin_country", { length: 3 }).notNull(),
  origin_city: varchar("origin_city", { length: 255 }).notNull(),
  destination_country: varchar("destination_country", { length: 3 }).notNull(),
  destination_city: varchar("destination_city", { length: 255 }).notNull(),
  cargo_description: text("cargo_description").notNull(),
  weight_kg: decimal("weight_kg", { precision: 10, scale: 2 }),
  volume_m3: decimal("volume_m3", { precision: 10, scale: 3 }),
  cargo_type: cargoTypeEnum("cargo_type"),
  delivery_type_preferred: deliveryPreferenceEnum("delivery_type_preferred"),
  budget_min: decimal("budget_min", { precision: 12, scale: 2 }),
  budget_max: decimal("budget_max", { precision: 12, scale: 2 }),
  desired_delivery_date: date("desired_delivery_date"),
  status: requestStatusEnum("status").notNull().default("new"),
  offer_deadline: timestamp("offer_deadline").notNull(),
  first_offer_at: timestamp("first_offer_at"),
  assigned_manager_id: uuid("assigned_manager_id").references(() => admins.id),
  sla_violated: boolean("sla_violated").notNull().default(false),
  source: requestSourceEnum("source").notNull().default("admin_manual"),
  parent_request_id: uuid("parent_request_id"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  closed_at: timestamp("closed_at"),
});

export const requestCarrierMatches = pgTable("request_carrier_matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  request_id: uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  carrier_id: uuid("carrier_id")
    .notNull()
    .references(() => carriers.id),
  sent_at: timestamp("sent_at").notNull().defaultNow(),
  viewed_at: timestamp("viewed_at"),
  responded: boolean("responded").notNull().default(false),
  reminder_sent: boolean("reminder_sent").notNull().default(false),
});
