import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, type Context } from "@cargo/api";

let db: any = null;

function getDb() {
  if (!db) {
    try {
      const dbModule = require("@cargo/db");
      db = dbModule.db;
    } catch (e) {
      console.warn("Database not available:", (e as Error).message);
      db = null;
    }
  }
  return db;
}

function extractAdmin(req: Request): Context["admin"] {
  try {
    const header = req.headers.get("x-admin-session");
    if (!header) return null;
    const session = JSON.parse(header);
    if (!session.logged_in) return null;
    // Require a real DB id — if missing, force re-login
    if (!session.id) return null;
    return {
      id: session.id,
      email: session.email || session.login || "admin",
      full_name: session.full_name || session.login || "Admin",
      role: session.role || "super_admin",
    };
  } catch {
    return null;
  }
}

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: (): Context => {
      const database = getDb();
      const admin = extractAdmin(req);
      if (!database) console.error("[tRPC] Database is NULL — DB not connected!");
      return { db: database, admin };
    },
    onError: ({ path, error }) => {
      console.error(`[tRPC] Error in ${path}:`, error.message);
    },
  });

export { handler as GET, handler as POST };
