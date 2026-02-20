import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq, asc } from "drizzle-orm";

const BOT_API_KEY = process.env.BOT_API_KEY;

function checkAuth(req: NextRequest) {
  if (!BOT_API_KEY) return { error: "BOT_API_KEY not configured", status: 500 };
  const key = req.headers.get("x-bot-key");
  if (!key || key !== BOT_API_KEY) return { error: "Unauthorized", status: 401 };
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/knowledge-publish?type=categories|tags|articles
// Возвращает список для агента — чтобы знал существующие slugs
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

  const type = req.nextUrl.searchParams.get("type") ?? "categories";

  if (type === "categories") {
    const rows = await db
      .select({
        id: schema.knowledgeCategories.id,
        title: schema.knowledgeCategories.title,
        slug: schema.knowledgeCategories.slug,
        description: schema.knowledgeCategories.description,
        icon: schema.knowledgeCategories.icon,
      })
      .from(schema.knowledgeCategories)
      .where(eq(schema.knowledgeCategories.is_active, true))
      .orderBy(asc(schema.knowledgeCategories.order));
    return NextResponse.json({ categories: rows });
  }

  if (type === "tags") {
    const rows = await db
      .select({
        id: schema.knowledgeTags.id,
        title: schema.knowledgeTags.title,
        slug: schema.knowledgeTags.slug,
      })
      .from(schema.knowledgeTags)
      .orderBy(asc(schema.knowledgeTags.title));
    return NextResponse.json({ tags: rows });
  }

  if (type === "articles") {
    const rows = await db
      .select({
        id: schema.knowledgeArticles.id,
        title: schema.knowledgeArticles.title,
        slug: schema.knowledgeArticles.slug,
        status: schema.knowledgeArticles.status,
        category_id: schema.knowledgeArticles.category_id,
      })
      .from(schema.knowledgeArticles)
      .orderBy(asc(schema.knowledgeArticles.title));
    return NextResponse.json({ articles: rows });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/knowledge-publish
// Body: { type: "article" | "category" | "tag", ...fields }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = body.type ?? "article";

  // ── Создать категорию ──────────────────────────────────────────────────────
  if (type === "category") {
    const { title, slug, description, icon, meta_title, meta_description } = body;
    if (!title || !slug) {
      return NextResponse.json({ error: "title and slug are required" }, { status: 400 });
    }
    const [cat] = await db
      .insert(schema.knowledgeCategories)
      .values({
        title,
        slug,
        description: description ?? null,
        icon: icon ?? null,
        meta_title: meta_title ?? null,
        meta_description: meta_description ?? null,
        is_active: true,
      })
      .returning();
    revalidatePath("/knowledge", "layout");
    return NextResponse.json({ ok: true, id: cat.id, slug: cat.slug, url: `/knowledge/category/${cat.slug}` });
  }

  // ── Создать тег ────────────────────────────────────────────────────────────
  if (type === "tag") {
    const { title, slug, description, meta_title, meta_description } = body;
    if (!title || !slug) {
      return NextResponse.json({ error: "title and slug are required" }, { status: 400 });
    }
    const [tag] = await db
      .insert(schema.knowledgeTags)
      .values({
        title,
        slug,
        description: description ?? null,
        meta_title: meta_title ?? null,
        meta_description: meta_description ?? null,
      })
      .returning();
    revalidatePath("/knowledge", "layout");
    return NextResponse.json({ ok: true, id: tag.id, slug: tag.slug });
  }

  // ── Создать статью (по умолчанию) ─────────────────────────────────────────
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
    return NextResponse.json({ error: "title and slug are required" }, { status: 400 });
  }

  // Найти категорию по slug
  let category_id: string | undefined;
  if (category_slug) {
    const [cat] = await db
      .select({ id: schema.knowledgeCategories.id })
      .from(schema.knowledgeCategories)
      .where(eq(schema.knowledgeCategories.slug, category_slug))
      .limit(1);
    category_id = cat?.id;
  }

  // Найти теги по slugs
  let tag_ids: string[] = [];
  if (tag_slugs.length > 0) {
    const tags = await db
      .select({ id: schema.knowledgeTags.id, slug: schema.knowledgeTags.slug })
      .from(schema.knowledgeTags);
    tag_ids = tags.filter((t) => tag_slugs.includes(t.slug)).map((t) => t.id);
  }

  // Вставить статью
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

  if (tag_ids.length > 0) {
    await db
      .insert(schema.knowledgeArticleTags)
      .values(tag_ids.map((tid) => ({ article_id: article.id, tag_id: tid })));
  }

  revalidatePath("/knowledge", "layout");
  return NextResponse.json({ ok: true, id: article.id, slug: article.slug, url: `/knowledge/${article.slug}` });
}
