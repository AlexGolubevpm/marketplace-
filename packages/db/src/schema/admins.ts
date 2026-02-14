import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  text,
  jsonb,
} from "drizzle-orm/pg-core";

export const adminRoleEnum = pgEnum("admin_role", [
  "super_admin",
  "operator",
  "analyst",
  "content_manager",
]);

export const adminStatusEnum = pgEnum("admin_status", ["active", "disabled"]);

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  full_name: varchar("full_name", { length: 255 }).notNull(),
  role: adminRoleEnum("role").notNull(),
  status: adminStatusEnum("status").notNull().default("active"),
  last_login_at: timestamp("last_login_at"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  admin_id: uuid("admin_id")
    .notNull()
    .references(() => admins.id),
  action: varchar("action", { length: 100 }).notNull(),
  entity_type: varchar("entity_type", { length: 50 }).notNull(),
  entity_id: uuid("entity_id").notNull(),
  old_values: jsonb("old_values"),
  new_values: jsonb("new_values"),
  ip_address: varchar("ip_address", { length: 45 }),
  user_agent: varchar("user_agent", { length: 500 }),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const internalComments = pgTable("internal_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  entity_type: varchar("entity_type", { length: 50 }).notNull(),
  entity_id: uuid("entity_id").notNull(),
  author_id: uuid("author_id")
    .notNull()
    .references(() => admins.id),
  text: text("text").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});
