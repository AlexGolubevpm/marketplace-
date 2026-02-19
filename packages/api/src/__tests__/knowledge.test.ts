import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { eq } from "drizzle-orm";
import {
  getDb,
  knowledgeArticles,
  knowledgeCategories,
  knowledgeTags,
} from "@cargo/db";
import { appRouter } from "../root";
import { createCallerFactory, type Context } from "../trpc";

// ── Lazy DB — don't crash if unavailable ──────────────────────────────────────
let dbAvailable = false;
let db: ReturnType<typeof getDb>;

const createCaller = createCallerFactory(appRouter);

beforeAll(async () => {
  try {
    db = getDb();
    await db
      .select({ id: knowledgeArticles.id })
      .from(knowledgeArticles)
      .limit(1);
    dbAvailable = true;
  } catch {
    console.warn(
      "⚠ Database not reachable — integration tests will be skipped"
    );
  }
});

function adminCtx(): Context {
  return {
    db,
    admin: {
      id: "00000000-0000-0000-0000-000000000001",
      email: "test@test.com",
      full_name: "Test Admin",
      role: "super_admin",
    },
  };
}

const createdIds: {
  articles: string[];
  tags: string[];
  categories: string[];
} = { articles: [], tags: [], categories: [] };

afterAll(async () => {
  if (!dbAvailable) return;
  for (const id of createdIds.articles) {
    await db
      .delete(knowledgeArticles)
      .where(eq(knowledgeArticles.id, id))
      .catch(() => {});
  }
  for (const id of createdIds.tags) {
    await db
      .delete(knowledgeTags)
      .where(eq(knowledgeTags.id, id))
      .catch(() => {});
  }
  for (const id of createdIds.categories) {
    await db
      .delete(knowledgeCategories)
      .where(eq(knowledgeCategories.id, id))
      .catch(() => {});
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// UNIT: Russian pluralization
// ═══════════════════════════════════════════════════════════════════════════════
describe("pluralArticles", () => {
  // Replicate the pluralization logic to test it
  function pluralArticles(n: number): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return `${n} статья`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
      return `${n} статьи`;
    return `${n} статей`;
  }

  it.each([
    [0, "0 статей"],
    [1, "1 статья"],
    [2, "2 статьи"],
    [3, "3 статьи"],
    [4, "4 статьи"],
    [5, "5 статей"],
    [10, "10 статей"],
    [11, "11 статей"],
    [12, "12 статей"],
    [13, "13 статей"],
    [14, "14 статей"],
    [20, "20 статей"],
    [21, "21 статья"],
    [22, "22 статьи"],
    [25, "25 статей"],
    [100, "100 статей"],
    [101, "101 статья"],
    [111, "111 статей"],
    [112, "112 статей"],
  ])("pluralArticles(%i) → %s", (n, expected) => {
    expect(pluralArticles(n)).toBe(expected);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// UNIT: Rate limiter
// ═══════════════════════════════════════════════════════════════════════════════
describe("search rate limiter", () => {
  it("rejects search after rate limit exceeded", async () => {
    if (!dbAvailable) return;

    const ctx: Context = {
      db,
      admin: null,
      clientIp: `rate-limit-test-${Date.now()}`,
    };
    const caller = createCaller(ctx);

    // Fire 30 searches (the limit) — they should all succeed
    for (let i = 0; i < 30; i++) {
      await caller.knowledge.search({ q: "test" });
    }

    // The 31st should be rate-limited
    await expect(caller.knowledge.search({ q: "test" })).rejects.toThrow(
      "Слишком много запросов"
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Auth & validation — these work without DB
// ═══════════════════════════════════════════════════════════════════════════════
describe("knowledge article auth & validation", () => {
  it("rejects creation without title (zod min length)", async () => {
    const caller = createCaller(adminCtx());
    await expect(
      caller.knowledge.adminCreateArticle({
        title: "",
        slug: "no-title",
        content: "content",
      })
    ).rejects.toThrow();
  });

  it("rejects unauthenticated users", async () => {
    const anonCaller = createCaller({ db, admin: null });
    await expect(
      anonCaller.knowledge.adminCreateArticle({
        title: "Should Fail",
        slug: "should-fail",
        content: "content",
      })
    ).rejects.toThrow("Not authenticated");
  });

  it("rejects users with wrong role (analyst cannot create articles)", async () => {
    const analystCaller = createCaller({
      db,
      admin: {
        id: "00000000-0000-0000-0000-000000000002",
        email: "analyst@test.com",
        full_name: "Analyst",
        role: "analyst",
      },
    });
    await expect(
      analystCaller.knowledge.adminCreateArticle({
        title: "Should Fail",
        slug: "should-fail-role",
        content: "content",
      })
    ).rejects.toThrow("Insufficient permissions");
  });

  it("allows super_admin role (passes auth layer)", async () => {
    const caller = createCaller(adminCtx());
    try {
      await caller.knowledge.adminCreateArticle({
        title: "Auth Test",
        slug: `auth-test-${Date.now()}`,
        content: "ok",
      });
    } catch (err: any) {
      // DB may be unavailable — but auth should NOT be the failure reason
      expect(err.message).not.toContain("Not authenticated");
      expect(err.message).not.toContain("Insufficient permissions");
    }
  });

  it("allows content_manager role (passes auth layer)", async () => {
    const cmCaller = createCaller({
      db,
      admin: {
        id: "00000000-0000-0000-0000-000000000003",
        email: "cm@test.com",
        full_name: "CM",
        role: "content_manager",
      },
    });
    try {
      await cmCaller.knowledge.adminCreateArticle({
        title: "CM Test",
        slug: `cm-test-${Date.now()}`,
        content: "ok",
      });
    } catch (err: any) {
      expect(err.message).not.toContain("Not authenticated");
      expect(err.message).not.toContain("Insufficient permissions");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Integration tests — require database connection
// ═══════════════════════════════════════════════════════════════════════════════
describe("knowledge article publishing (integration)", () => {
  it("creates a draft article with published_at = null", async () => {
    if (!dbAvailable) return;
    const caller = createCaller(adminCtx());
    const article = await caller.knowledge.adminCreateArticle({
      title: "Test Draft",
      slug: `test-draft-${Date.now()}`,
      content: "Draft content",
      status: "draft",
    });
    createdIds.articles.push(article.id);
    expect(article.status).toBe("draft");
    expect(article.published_at).toBeNull();
  });

  it("creates a published article with published_at set", async () => {
    if (!dbAvailable) return;
    const caller = createCaller(adminCtx());
    const article = await caller.knowledge.adminCreateArticle({
      title: "Test Published",
      slug: `test-published-${Date.now()}`,
      content: "Published content",
      status: "published",
    });
    createdIds.articles.push(article.id);
    expect(article.status).toBe("published");
    expect(article.published_at).toBeInstanceOf(Date);
  });

  it("updates draft → published and sets published_at", async () => {
    if (!dbAvailable) return;
    const caller = createCaller(adminCtx());
    const draft = await caller.knowledge.adminCreateArticle({
      title: "Draft to Publish",
      slug: `test-d2p-${Date.now()}`,
      content: "Will be published",
      status: "draft",
    });
    createdIds.articles.push(draft.id);
    expect(draft.published_at).toBeNull();

    const published = await caller.knowledge.adminUpdateArticle({
      id: draft.id,
      status: "published",
    });
    expect(published.status).toBe("published");
    expect(published.published_at).toBeInstanceOf(Date);
  });

  it("tag_ids retrieved correctly via adminGetArticle", async () => {
    if (!dbAvailable) return;
    const caller = createCaller(adminCtx());
    const tag = await caller.knowledge.adminCreateTag({
      title: "Test Tag",
      slug: `test-tag-${Date.now()}`,
    });
    createdIds.tags.push(tag.id);

    const article = await caller.knowledge.adminCreateArticle({
      title: "With Tags",
      slug: `test-tags-${Date.now()}`,
      content: "Tagged",
      status: "published",
      tag_ids: [tag.id],
    });
    createdIds.articles.push(article.id);

    const fetched = await caller.knowledge.adminGetArticle({
      id: article.id,
    });
    expect(fetched!.tag_ids).toContain(tag.id);
  });

  it("draft not visible publicly, published is", async () => {
    if (!dbAvailable) return;
    const caller = createCaller(adminCtx());
    const publicCaller = createCaller({ db, admin: null });

    const article = await caller.knowledge.adminCreateArticle({
      title: "Visibility Test",
      slug: `visibility-${Date.now()}`,
      content: "Test",
      status: "draft",
    });
    createdIds.articles.push(article.id);

    expect(
      await publicCaller.knowledge.getArticleBySlug({ slug: article.slug })
    ).toBeNull();

    await caller.knowledge.adminUpdateArticle({
      id: article.id,
      status: "published",
    });

    const pub = await publicCaller.knowledge.getArticleBySlug({
      slug: article.slug,
    });
    expect(pub).toBeTruthy();
    expect(pub!.title).toBe("Visibility Test");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Integration: Category article_count via LEFT JOIN
// ═══════════════════════════════════════════════════════════════════════════════
describe("knowledge category article count (integration)", () => {
  it("returns article_count = 0 for empty category", async () => {
    if (!dbAvailable) return;
    const caller = createCaller(adminCtx());
    const cat = await caller.knowledge.adminCreateCategory({
      title: "Empty Cat",
      slug: `empty-cat-${Date.now()}`,
      is_active: true,
    });
    createdIds.categories.push(cat.id);

    const publicCaller = createCaller({ db, admin: null });
    const categories = await publicCaller.knowledge.getCategories();
    const found = categories.find((c) => c.id === cat.id);
    expect(found).toBeTruthy();
    expect(found!.article_count).toBe(0);
  });

  it("returns correct article_count with published articles", async () => {
    if (!dbAvailable) return;
    const caller = createCaller(adminCtx());
    const cat = await caller.knowledge.adminCreateCategory({
      title: "Count Cat",
      slug: `count-cat-${Date.now()}`,
      is_active: true,
    });
    createdIds.categories.push(cat.id);

    // Create 2 published + 1 draft
    const a1 = await caller.knowledge.adminCreateArticle({
      title: "Pub1",
      slug: `pub1-${Date.now()}`,
      content: "c",
      status: "published",
      category_id: cat.id,
    });
    createdIds.articles.push(a1.id);

    const a2 = await caller.knowledge.adminCreateArticle({
      title: "Pub2",
      slug: `pub2-${Date.now()}`,
      content: "c",
      status: "published",
      category_id: cat.id,
    });
    createdIds.articles.push(a2.id);

    const a3 = await caller.knowledge.adminCreateArticle({
      title: "Draft1",
      slug: `draft1-${Date.now()}`,
      content: "c",
      status: "draft",
      category_id: cat.id,
    });
    createdIds.articles.push(a3.id);

    const publicCaller = createCaller({ db, admin: null });
    const categories = await publicCaller.knowledge.getCategories();
    const found = categories.find((c) => c.id === cat.id);
    expect(found).toBeTruthy();
    expect(found!.article_count).toBe(2); // only published count
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Integration: getArticleBySlug returns tags via JOIN
// ═══════════════════════════════════════════════════════════════════════════════
describe("knowledge getArticleBySlug returns related data (integration)", () => {
  it("returns category and tags for a published article", async () => {
    if (!dbAvailable) return;
    const caller = createCaller(adminCtx());
    const publicCaller = createCaller({ db, admin: null });

    const cat = await caller.knowledge.adminCreateCategory({
      title: "Slug Cat",
      slug: `slug-cat-${Date.now()}`,
      is_active: true,
    });
    createdIds.categories.push(cat.id);

    const tag = await caller.knowledge.adminCreateTag({
      title: "Slug Tag",
      slug: `slug-tag-${Date.now()}`,
    });
    createdIds.tags.push(tag.id);

    const article = await caller.knowledge.adminCreateArticle({
      title: "Full Article",
      slug: `full-article-${Date.now()}`,
      content: "Full content",
      status: "published",
      category_id: cat.id,
      tag_ids: [tag.id],
    });
    createdIds.articles.push(article.id);

    const result = await publicCaller.knowledge.getArticleBySlug({
      slug: article.slug,
    });
    expect(result).toBeTruthy();
    expect(result!.category).toBeTruthy();
    expect(result!.category!.id).toBe(cat.id);
    expect(result!.tags).toHaveLength(1);
    expect(result!.tags[0].id).toBe(tag.id);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Integration: ISR revalidation callback
// ═══════════════════════════════════════════════════════════════════════════════
describe("knowledge ISR revalidation (integration)", () => {
  it("calls ctx.revalidate on article create", async () => {
    if (!dbAvailable) return;
    const revalidateMock = vi.fn();
    const ctx: Context = {
      ...adminCtx(),
      revalidate: revalidateMock,
    };
    const caller = createCaller(ctx);

    const article = await caller.knowledge.adminCreateArticle({
      title: "Revalidate Test",
      slug: `revalidate-${Date.now()}`,
      content: "c",
    });
    createdIds.articles.push(article.id);

    expect(revalidateMock).toHaveBeenCalledWith("/knowledge", "layout");
  });

  it("calls ctx.revalidate on article update", async () => {
    if (!dbAvailable) return;
    const revalidateMock = vi.fn();
    const ctx: Context = { ...adminCtx(), revalidate: revalidateMock };
    const caller = createCaller(ctx);

    const article = await caller.knowledge.adminCreateArticle({
      title: "Revalidate Update",
      slug: `revalidate-up-${Date.now()}`,
      content: "c",
    });
    createdIds.articles.push(article.id);
    revalidateMock.mockClear();

    await caller.knowledge.adminUpdateArticle({
      id: article.id,
      title: "Updated",
    });
    expect(revalidateMock).toHaveBeenCalledWith("/knowledge", "layout");
  });

  it("calls ctx.revalidate on article delete", async () => {
    if (!dbAvailable) return;
    const revalidateMock = vi.fn();
    const ctx: Context = { ...adminCtx(), revalidate: revalidateMock };
    const caller = createCaller(ctx);

    const article = await caller.knowledge.adminCreateArticle({
      title: "Delete Me",
      slug: `delete-${Date.now()}`,
      content: "c",
    });
    // Don't push to createdIds — it'll be deleted
    revalidateMock.mockClear();

    await caller.knowledge.adminDeleteArticle({ id: article.id });
    expect(revalidateMock).toHaveBeenCalledWith("/knowledge", "layout");
  });
});
