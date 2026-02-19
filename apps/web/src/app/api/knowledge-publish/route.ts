import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

const BOT_API_KEY = process.env.BOT_API_KEY;

/**
 * POST /api/knowledge-publish
 *
 * Публикация SEO-статьи из Telegram-бота (OpenClaw).
 * Защищён секретным ключом в заголовке X-Bot-Key.
 *
 * Body (JSON):
 * {
 *   title:         string          — обязательно
 *   slug:          string          — обязательно, URL-friendly (латиница, дефисы)
 *   description?:  string          — мета-описание (160 символов)
 *   content:       string          — тело статьи в Markdown
 *   status?:       "draft" | "published"   — по умолчанию "published"
 *   category_slug?: string         — slug категории (ищем по slug)
 *   tag_slugs?:    string[]        — slugs тегов (ищем по slug)
 *   faq_items?:    { question, answer }[]
 *   sources?:      { title, url }[]
 *   author_name?:  string
 *   is_featured?:  boolean
 * }
 */
export async function POST(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  if (!BOT_API_KEY) {
    return NextResponse.json(
      { error: "BOT_API_KEY not configured on server" },
      { status: 500 }
    );
  }

  const incomingKey = req.headers.get("x-bot-key");
  if (!incomingKey || incomingKey !== BOT_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────────
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    title,
    slug,
    description,
    content = "",
    status = "published",
    category_slug,
    tag_slugs = [],
    faq_items = [],
    sources = [],
    author_name,
    is_featured = false,
  } = body;

  if (!title || !slug) {
    return NextResponse.json(
      { error: "title and slug are required" },
      { status: 400 }
    );
  }

  // ── Resolve category ──────────────────────────────────────────────────────────
  let category_id: string | undefined;
  if (category_slug) {
    const [cat] = await db
      .select({ id: schema.knowledgeCategories.id })
      .from(schema.knowledgeCategories)
      .where(eq(schema.knowledgeCategories.slug, category_slug))
      .limit(1);
    category_id = cat?.id;
  }

  // ── Resolve tags ──────────────────────────────────────────────────────────────
  let tag_ids: string[] = [];
  if (tag_slugs.length > 0) {
    const tags = await db
      .select({ id: schema.knowledgeTags.id, slug: schema.knowledgeTags.slug })
      .from(schema.knowledgeTags);
    tag_ids = tags
      .filter((t) => tag_slugs.includes(t.slug))
      .map((t) => t.id);
  }

  // ── Insert article ────────────────────────────────────────────────────────────
  const [article] = await db
    .insert(schema.knowledgeArticles)
    .values({
      title,
      slug,
      description: description ?? null,
      content,
      status,
      category_id: category_id ?? null,
      faq_items,
      sources,
      author_name: author_name ?? null,
      is_featured,
      published_at: status === "published" ? new Date() : undefined,
    })
    .returning();

  // ── Attach tags ───────────────────────────────────────────────────────────────
  if (tag_ids.length > 0) {
    await db
      .insert(schema.knowledgeArticleTags)
      .values(tag_ids.map((tid) => ({ article_id: article.id, tag_id: tid })));
  }

  // ── ISR revalidation ──────────────────────────────────────────────────────────
  revalidatePath("/knowledge", "layout");

  return NextResponse.json({
    ok: true,
    id: article.id,
    slug: article.slug,
    url: `/knowledge/${article.slug}`,
  });
}
