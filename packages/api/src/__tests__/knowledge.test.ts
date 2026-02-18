import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { getDb, knowledgeArticles, knowledgeTags } from "@cargo/db";
import { appRouter } from "../root";
import { createCallerFactory, type Context } from "../trpc";

// ── Lazy DB — don't crash if unavailable ──────────────────────────────────────
let dbAvailable = false;
let db: ReturnType<typeof getDb>;

const createCaller = createCallerFactory(appRouter);

beforeAll(async () => {
  try {
    db = getDb();
    await db.select({ id: knowledgeArticles.id }).from(knowledgeArticles).limit(1);
    dbAvailable = true;
  } catch {
    console.warn("⚠ Database not reachable — integration tests will be skipped");
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

const createdIds: { articles: string[]; tags: string[] } = { articles: [], tags: [] };

afterAll(async () => {
  if (!dbAvailable) return;
  for (const id of createdIds.articles) {
    await db.delete(knowledgeArticles).where(eq(knowledgeArticles.id, id)).catch(() => {});
  }
  for (const id of createdIds.tags) {
    await db.delete(knowledgeTags).where(eq(knowledgeTags.id, id)).catch(() => {});
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Auth & validation — these work without DB
// ═══════════════════════════════════════════════════════════════════════════════
describe("knowledge article auth & validation", () => {
  it("rejects creation without title (zod min length)", async () => {
    const caller = createCaller(adminCtx());
    await expect(
      caller.knowledge.adminCreateArticle({ title: "", slug: "no-title", content: "content" })
    ).rejects.toThrow();
  });

  it("rejects unauthenticated users", async () => {
    const anonCaller = createCaller({ db, admin: null });
    await expect(
      anonCaller.knowledge.adminCreateArticle({
        title: "Should Fail", slug: "should-fail", content: "content",
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
        title: "Should Fail", slug: "should-fail-role", content: "content",
      })
    ).rejects.toThrow("Insufficient permissions");
  });

  it("allows super_admin role (passes auth layer)", async () => {
    const caller = createCaller(adminCtx());
    try {
      await caller.knowledge.adminCreateArticle({
        title: "Auth Test", slug: `auth-test-${Date.now()}`, content: "ok",
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
        title: "CM Test", slug: `cm-test-${Date.now()}`, content: "ok",
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
      title: "Test Tag", slug: `test-tag-${Date.now()}`,
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

    const fetched = await caller.knowledge.adminGetArticle({ id: article.id });
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

    expect(await publicCaller.knowledge.getArticleBySlug({ slug: article.slug })).toBeNull();

    await caller.knowledge.adminUpdateArticle({ id: article.id, status: "published" });

    const pub = await publicCaller.knowledge.getArticleBySlug({ slug: article.slug });
    expect(pub).toBeTruthy();
    expect(pub!.title).toBe("Visibility Test");
  });
});
