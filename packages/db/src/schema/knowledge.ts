import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";
import { admins } from "./admins";

// ── Enums ──────────────────────────────────────────────────────────────────────
export const knowledgeArticleStatusEnum = pgEnum("knowledge_article_status", [
  "draft",
  "published",
]);

// ── Categories ─────────────────────────────────────────────────────────────────
export const knowledgeCategories = pgTable("knowledge_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  image_url: varchar("image_url", { length: 1000 }),
  icon: varchar("icon", { length: 50 }),
  order: integer("order").notNull().default(0),
  is_active: boolean("is_active").notNull().default(true),
  meta_title: varchar("meta_title", { length: 500 }),
  meta_description: text("meta_description"),
  canonical_override: varchar("canonical_override", { length: 1000 }),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// ── Articles ───────────────────────────────────────────────────────────────────
export const knowledgeArticles = pgTable("knowledge_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  category_id: uuid("category_id").references(() => knowledgeCategories.id, {
    onDelete: "set null",
  }),
  content: text("content").notNull().default(""),
  faq_items: jsonb("faq_items")
    .$type<Array<{ question: string; answer: string }>>()
    .default([]),
  sources: jsonb("sources")
    .$type<Array<{ title: string; url: string }>>()
    .default([]),
  status: knowledgeArticleStatusEnum("status").notNull().default("draft"),
  published_at: timestamp("published_at"),
  author_name: varchar("author_name", { length: 255 }),
  reviewer_name: varchar("reviewer_name", { length: 255 }),
  is_featured: boolean("is_featured").notNull().default(false),
  canonical_override: varchar("canonical_override", { length: 1000 }),
  redirects_from: jsonb("redirects_from")
    .$type<string[]>()
    .default([]),
  sort_order: integer("sort_order").notNull().default(0),
  created_by: uuid("created_by").references(() => admins.id),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// ── Tags ───────────────────────────────────────────────────────────────────────
export const knowledgeTags = pgTable("knowledge_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  meta_title: varchar("meta_title", { length: 500 }),
  meta_description: text("meta_description"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// ── Article ↔ Tag join ─────────────────────────────────────────────────────────
export const knowledgeArticleTags = pgTable(
  "knowledge_article_tags",
  {
    article_id: uuid("article_id")
      .notNull()
      .references(() => knowledgeArticles.id, { onDelete: "cascade" }),
    tag_id: uuid("tag_id")
      .notNull()
      .references(() => knowledgeTags.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.article_id, t.tag_id] }),
  })
);

// ── Redirects ──────────────────────────────────────────────────────────────────
export const knowledgeRedirects = pgTable("knowledge_redirects", {
  id: uuid("id").primaryKey().defaultRandom(),
  from_path: varchar("from_path", { length: 1000 }).notNull().unique(),
  to_path: varchar("to_path", { length: 1000 }).notNull(),
  status_code: integer("status_code").notNull().default(301),
  created_at: timestamp("created_at").notNull().defaultNow(),
});
