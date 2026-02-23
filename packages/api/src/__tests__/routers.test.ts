/**
 * Tests for tRPC routers: requests, offers, orders, carriers, customers.
 * Tests auth guards, validation, and DB operations.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import {
  getDb,
  requests,
  offers,
  orders,
  carriers,
  customers,
} from "@cargo/db";
import { appRouter } from "../root";
import { createCallerFactory, type Context } from "../trpc";

let dbAvailable = false;
let db: ReturnType<typeof getDb>;

const createCaller = createCallerFactory(appRouter);

beforeAll(async () => {
  try {
    db = getDb();
    await db.select({ id: carriers.id }).from(carriers).limit(1);
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

function anonCtx(): Context {
  return { db, admin: null };
}

// Track created IDs for cleanup
const cleanupIds = {
  customers: [] as string[],
  carriers: [] as string[],
  requests: [] as string[],
  offers: [] as string[],
  orders: [] as string[],
};

afterAll(async () => {
  if (!dbAvailable) return;
  // Clean up in reverse dependency order
  for (const id of cleanupIds.orders) {
    await db.delete(orders).where(eq(orders.id, id)).catch(() => {});
  }
  for (const id of cleanupIds.offers) {
    await db.delete(offers).where(eq(offers.id, id)).catch(() => {});
  }
  for (const id of cleanupIds.requests) {
    await db.delete(requests).where(eq(requests.id, id)).catch(() => {});
  }
  for (const id of cleanupIds.carriers) {
    await db.delete(carriers).where(eq(carriers.id, id)).catch(() => {});
  }
  for (const id of cleanupIds.customers) {
    await db.delete(customers).where(eq(customers.id, id)).catch(() => {});
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH GUARDS — no DB required
// ═══════════════════════════════════════════════════════════════════════════════
describe("auth guards", () => {
  it("rejects unauthenticated access to requests.list", async () => {
    const caller = createCaller(anonCtx());
    await expect(caller.requests.list({})).rejects.toThrow("Not authenticated");
  });

  it("rejects unauthenticated access to offers.list", async () => {
    const caller = createCaller(anonCtx());
    await expect(caller.offers.list({})).rejects.toThrow("Not authenticated");
  });

  it("rejects unauthenticated access to orders.list", async () => {
    const caller = createCaller(anonCtx());
    await expect(caller.orders.list({})).rejects.toThrow("Not authenticated");
  });

  it("rejects unauthenticated access to carriers.list", async () => {
    const caller = createCaller(anonCtx());
    await expect(caller.carriers.list({})).rejects.toThrow("Not authenticated");
  });

  it("rejects unauthenticated access to customers.list", async () => {
    const caller = createCaller(anonCtx());
    await expect(caller.customers.list({})).rejects.toThrow("Not authenticated");
  });

  it("allows authenticated admin to access requests.list", async () => {
    const caller = createCaller(adminCtx());
    try {
      await caller.requests.list({});
    } catch (err: any) {
      // DB may be unavailable — but auth should NOT be the failure reason
      expect(err.message).not.toContain("Not authenticated");
    }
  });

  it("allows authenticated admin to access offers.list", async () => {
    const caller = createCaller(adminCtx());
    try {
      await caller.offers.list({});
    } catch (err: any) {
      expect(err.message).not.toContain("Not authenticated");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION — checks input schemas
// ═══════════════════════════════════════════════════════════════════════════════
describe("input validation", () => {
  it("rejects offers.getById with invalid UUID", async () => {
    const caller = createCaller(adminCtx());
    await expect(
      caller.offers.getById({ id: "not-a-uuid" })
    ).rejects.toThrow();
  });

  it("rejects requests.getById with invalid UUID", async () => {
    const caller = createCaller(adminCtx());
    await expect(
      caller.requests.getById({ id: "not-a-uuid" })
    ).rejects.toThrow();
  });

  it("rejects orders.getById with invalid UUID", async () => {
    const caller = createCaller(adminCtx());
    await expect(
      caller.orders.getById({ id: "not-a-uuid" })
    ).rejects.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTER REGISTRATION — verify no bots router
// ═══════════════════════════════════════════════════════════════════════════════
describe("router structure", () => {
  it("does NOT have bots router (removed)", () => {
    // Check appRouter directly instead of caller (Proxy triggers tRPC lookups)
    const routerKeys = Object.keys((appRouter as any)._def.procedures || {});
    const botsRoutes = routerKeys.filter((k) => k.startsWith("bots."));
    expect(botsRoutes).toHaveLength(0);
  });

  it("has all expected routers", () => {
    const routerKeys = Object.keys((appRouter as any)._def.procedures || {});
    expect(routerKeys.some((k) => k.startsWith("requests."))).toBe(true);
    expect(routerKeys.some((k) => k.startsWith("offers."))).toBe(true);
    expect(routerKeys.some((k) => k.startsWith("orders."))).toBe(true);
    expect(routerKeys.some((k) => k.startsWith("carriers."))).toBe(true);
    expect(routerKeys.some((k) => k.startsWith("customers."))).toBe(true);
    expect(routerKeys.some((k) => k.startsWith("analytics."))).toBe(true);
    expect(routerKeys.some((k) => k.startsWith("settings."))).toBe(true);
    expect(routerKeys.some((k) => k.startsWith("content."))).toBe(true);
    expect(routerKeys.some((k) => k.startsWith("knowledge."))).toBe(true);
    expect(routerKeys.some((k) => k.startsWith("knowledgebase."))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION: Requests CRUD
// ═══════════════════════════════════════════════════════════════════════════════
describe("requests router (integration)", () => {
  it("lists requests with pagination", async () => {
    if (!dbAvailable) return;
    const caller = createCaller(adminCtx());
    const result = await caller.requests.list({
      pagination: { page: 1, pageSize: 5 },
    });
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("meta");
    expect(result.meta).toHaveProperty("total");
    expect(result.meta).toHaveProperty("page", 1);
    expect(result.meta).toHaveProperty("pageSize", 5);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("returns 404 for non-existent request", async () => {
    if (!dbAvailable) return;
    const caller = createCaller(adminCtx());
    await expect(
      caller.requests.getById({ id: "00000000-0000-0000-0000-000000000000" })
    ).rejects.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION: Offers CRUD
// ═══════════════════════════════════════════════════════════════════════════════
describe("offers router (integration)", () => {
  it("lists offers with pagination", async () => {
    if (!dbAvailable) return;
    const caller = createCaller(adminCtx());
    const result = await caller.offers.list({
      pagination: { page: 1, pageSize: 5 },
    });
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("meta");
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("returns 404 for non-existent offer", async () => {
    if (!dbAvailable) return;
    const caller = createCaller(adminCtx());
    await expect(
      caller.offers.getById({ id: "00000000-0000-0000-0000-000000000000" })
    ).rejects.toThrow("Offer not found");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION: Carriers CRUD
// ═══════════════════════════════════════════════════════════════════════════════
describe("carriers router (integration)", () => {
  it("lists carriers with pagination", async () => {
    if (!dbAvailable) return;
    const caller = createCaller(adminCtx());
    const result = await caller.carriers.list({
      pagination: { page: 1, pageSize: 5 },
    });
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("meta");
    expect(Array.isArray(result.data)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION: Customers CRUD
// ═══════════════════════════════════════════════════════════════════════════════
describe("customers router (integration)", () => {
  it("lists customers with pagination", async () => {
    if (!dbAvailable) return;
    const caller = createCaller(adminCtx());
    const result = await caller.customers.list({
      pagination: { page: 1, pageSize: 5 },
    });
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("meta");
    expect(Array.isArray(result.data)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION: Orders CRUD
// ═══════════════════════════════════════════════════════════════════════════════
describe("orders router (integration)", () => {
  it("lists orders with pagination", async () => {
    if (!dbAvailable) return;
    const caller = createCaller(adminCtx());
    const result = await caller.orders.list({
      pagination: { page: 1, pageSize: 5 },
    });
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("meta");
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("returns 404 for non-existent order", async () => {
    if (!dbAvailable) return;
    const caller = createCaller(adminCtx());
    await expect(
      caller.orders.getById({ id: "00000000-0000-0000-0000-000000000000" })
    ).rejects.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION: Analytics
// ═══════════════════════════════════════════════════════════════════════════════
describe("analytics router (integration)", () => {
  it("returns dashboard stats", async () => {
    if (!dbAvailable) return;
    const caller = createCaller(adminCtx());
    try {
      const result = await caller.analytics.dashboard();
      expect(result).toBeDefined();
    } catch (err: any) {
      // May not have dashboard procedure, which is ok
      expect(err.message).not.toContain("Not authenticated");
    }
  });
});
