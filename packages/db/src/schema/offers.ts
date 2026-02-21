import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  decimal,
  integer,
  boolean,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { requests } from "./requests";
import { carriers } from "./carriers";
import { deliveryTypeEnum } from "./carriers";

export const offerStatusEnum = pgEnum("offer_status", [
  "active",
  "selected",
  "rejected",
  "expired",
  "hidden",
  "suspicious",
]);

export const offers = pgTable(
  "offers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    display_id: varchar("display_id", { length: 20 }).notNull().unique(),
    request_id: uuid("request_id")
      .notNull()
      .references(() => requests.id),
    carrier_id: uuid("carrier_id")
      .notNull()
      .references(() => carriers.id),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    estimated_days: integer("estimated_days").notNull(),
    delivery_type: deliveryTypeEnum("delivery_type").notNull(),
    conditions: text("conditions"),
    valid_until: timestamp("valid_until"),
    status: offerStatusEnum("status").notNull().default("active"),
    is_editable: boolean("is_editable").notNull().default(true),
    suspicious_reason: varchar("suspicious_reason", { length: 500 }),
    selected_at: timestamp("selected_at"),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    unique("offer_request_carrier_unique").on(table.request_id, table.carrier_id),
    index("idx_offers_request_id").on(table.request_id),
    index("idx_offers_carrier_id").on(table.carrier_id),
    index("idx_offers_status").on(table.status),
  ]
);
