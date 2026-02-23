import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  decimal,
  date,
  index,
} from "drizzle-orm/pg-core";
import { requests } from "./requests";
import { offers } from "./offers";
import { customers } from "./customers";
import { carriers } from "./carriers";
import { admins } from "./admins";

export const orderStatusEnum = pgEnum("order_status", [
  "payment_pending",
  "confirmed",
  "awaiting_shipment",
  "in_transit",
  "customs",
  "customs_hold",
  "delivered",
  "completed",
  "cancelled",
  "dispute",
  "on_hold",
  "partially_delivered",
  "return",
]);

export const changeSourceEnum = pgEnum("change_source", [
  "admin",
  "system",
  "carrier",
  "customer",
  "webhook",
]);

export const documentTypeEnum = pgEnum("document_type", [
  "invoice",
  "customs_declaration",
  "bill_of_lading",
  "photo",
  "contract",
  "other",
]);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  display_id: varchar("display_id", { length: 20 }).notNull().unique(),
  request_id: uuid("request_id")
    .notNull()
    .references(() => requests.id),
  offer_id: uuid("offer_id")
    .notNull()
    .references(() => offers.id),
  customer_id: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  carrier_id: uuid("carrier_id")
    .notNull()
    .references(() => carriers.id),
  status: orderStatusEnum("status").notNull().default("payment_pending"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  commission_amount: decimal("commission_amount", { precision: 12, scale: 2 }),
  commission_rate: decimal("commission_rate", { precision: 5, scale: 4 }),
  tracking_number: varchar("tracking_number", { length: 100 }),
  tracking_url: varchar("tracking_url", { length: 500 }),
  estimated_delivery_date: date("estimated_delivery_date"),
  actual_delivery_date: date("actual_delivery_date"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  completed_at: timestamp("completed_at"),
}, (table) => [
  index("idx_orders_request_id").on(table.request_id),
  index("idx_orders_offer_id").on(table.offer_id),
  index("idx_orders_customer_id").on(table.customer_id),
  index("idx_orders_carrier_id").on(table.carrier_id),
  index("idx_orders_status").on(table.status),
]);

export const orderStatusHistory = pgTable("order_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  order_id: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  from_status: orderStatusEnum("from_status"),
  to_status: orderStatusEnum("to_status").notNull(),
  changed_by: uuid("changed_by").references(() => admins.id),
  change_source: changeSourceEnum("change_source").notNull().default("admin"),
  comment: text("comment"),
  created_at: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_order_status_history_order_id").on(table.order_id),
]);

export const orderDocuments = pgTable("order_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  order_id: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  file_name: varchar("file_name", { length: 255 }).notNull(),
  file_url: varchar("file_url", { length: 500 }).notNull(),
  file_type: documentTypeEnum("file_type").notNull(),
  uploaded_by: varchar("uploaded_by", { length: 100 }),
  uploaded_by_role: varchar("uploaded_by_role", { length: 20 }).notNull().default("admin"),
  created_at: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_order_documents_order_id").on(table.order_id),
]);
