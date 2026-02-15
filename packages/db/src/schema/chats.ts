import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { requests } from "./requests";
import { offers } from "./offers";
import { customers } from "./customers";
import { carriers } from "./carriers";

export const chatParticipantRoleEnum = pgEnum("chat_participant_role", [
  "customer",
  "carrier",
]);

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  request_id: uuid("request_id")
    .notNull()
    .references(() => requests.id),
  offer_id: uuid("offer_id").references(() => offers.id),
  customer_id: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  carrier_id: uuid("carrier_id")
    .notNull()
    .references(() => carriers.id),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversation_id: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  sender_role: chatParticipantRoleEnum("sender_role").notNull(),
  sender_id: uuid("sender_id").notNull(),
  text: text("text"),
  file_url: varchar("file_url", { length: 500 }),
  file_name: varchar("file_name", { length: 255 }),
  created_at: timestamp("created_at").notNull().defaultNow(),
});
