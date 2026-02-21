import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const recipientTypeEnum = pgEnum("recipient_type", [
  "carrier",
  "customer",
  "admin",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "telegram",
  "email",
  "sms",
  "in_app",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "delivered",
  "failed",
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipient_type: recipientTypeEnum("recipient_type").notNull(),
  recipient_id: uuid("recipient_id").notNull(),
  channel: notificationChannelEnum("channel").notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  payload: jsonb("payload").notNull(),
  status: notificationStatusEnum("status").notNull().default("pending"),
  sent_at: timestamp("sent_at"),
  error_message: text("error_message"),
  created_at: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_notifications_recipient").on(table.recipient_type, table.recipient_id),
  index("idx_notifications_status").on(table.status),
]);
