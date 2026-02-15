import { pgTable, uuid, varchar, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { admins } from "./admins";

export const kbSections = pgTable("kb_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  sort_order: integer("sort_order").notNull().default(0),
  is_published: boolean("is_published").notNull().default(false),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const kbArticles = pgTable("kb_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  section_id: uuid("section_id").notNull().references(() => kbSections.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 200 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  sort_order: integer("sort_order").notNull().default(0),
  is_published: boolean("is_published").notNull().default(false),
  created_by: uuid("created_by").references(() => admins.id),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});
