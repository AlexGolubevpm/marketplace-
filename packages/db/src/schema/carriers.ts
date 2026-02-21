import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  decimal,
  integer,
  index,
} from "drizzle-orm/pg-core";

export const carrierStatusEnum = pgEnum("carrier_status", [
  "active",
  "suspended",
  "blocked",
  "pending_review",
]);

export const deliveryTypeEnum = pgEnum("delivery_type", [
  "air",
  "sea",
  "rail",
  "road",
  "multimodal",
]);

export const carriers = pgTable("carriers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  contact_name: varchar("contact_name", { length: 255 }).notNull(),
  contact_phone: varchar("contact_phone", { length: 50 }).notNull(),
  contact_email: varchar("contact_email", { length: 255 }).unique(),
  password_hash: varchar("password_hash", { length: 255 }),
  telegram_id: varchar("telegram_id", { length: 255 }),
  logo_url: varchar("logo_url", { length: 500 }),
  description: text("description"),
  status: carrierStatusEnum("status").notNull().default("active"),
  sla_rating: decimal("sla_rating", { precision: 3, scale: 2 }),
  avg_response_time_minutes: integer("avg_response_time_minutes"),
  total_requests_received: integer("total_requests_received").notNull().default(0),
  total_offers_made: integer("total_offers_made").notNull().default(0),
  total_offers_won: integer("total_offers_won").notNull().default(0),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_carriers_telegram_id").on(table.telegram_id),
  index("idx_carriers_status").on(table.status),
]);

export const carrierRegions = pgTable("carrier_regions", {
  id: uuid("id").primaryKey().defaultRandom(),
  carrier_id: uuid("carrier_id")
    .notNull()
    .references(() => carriers.id, { onDelete: "cascade" }),
  country_from: varchar("country_from", { length: 3 }).notNull(),
  city_from: varchar("city_from", { length: 255 }),
  country_to: varchar("country_to", { length: 3 }).notNull(),
  city_to: varchar("city_to", { length: 255 }),
}, (table) => [
  index("idx_carrier_regions_carrier_id").on(table.carrier_id),
]);

export const carrierDeliveryTypes = pgTable("carrier_delivery_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  carrier_id: uuid("carrier_id")
    .notNull()
    .references(() => carriers.id, { onDelete: "cascade" }),
  type: deliveryTypeEnum("type").notNull(),
  max_weight_kg: decimal("max_weight_kg", { precision: 12, scale: 2 }),
  max_volume_m3: decimal("max_volume_m3", { precision: 12, scale: 3 }),
}, (table) => [
  index("idx_carrier_delivery_types_carrier_id").on(table.carrier_id),
]);
