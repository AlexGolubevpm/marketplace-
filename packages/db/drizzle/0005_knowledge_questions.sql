CREATE TYPE "public"."knowledge_question_status" AS ENUM('new', 'reviewed', 'published', 'rejected');--> statement-breakpoint

CREATE TABLE "knowledge_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"question" text NOT NULL,
	"topic" varchar(255),
	"status" "knowledge_question_status" DEFAULT 'new' NOT NULL,
	"admin_notes" text,
	"article_id" uuid REFERENCES "knowledge_articles"("id") ON DELETE SET NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
