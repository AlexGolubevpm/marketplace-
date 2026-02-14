import { pgTable, uuid, varchar, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { carriers } from "./carriers";

export const sessionTypeEnum = pgEnum("session_type", [
  "customer",
  "carrier",
  "admin",
]);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  session_type: sessionTypeEnum("session_type").notNull(),
  user_id: uuid("user_id").notNull(),
  refresh_token_hash: varchar("refresh_token_hash", { length: 255 }).notNull(),
  ip_address: varchar("ip_address", { length: 45 }),
  user_agent: varchar("user_agent", { length: 500 }),
  expires_at: timestamp("expires_at").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});
