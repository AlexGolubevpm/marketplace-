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
    return {
      id: session.id || "00000000-0000-0000-0000-000000000000",
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
    createContext: (): Context => ({
      db: getDb(),
      admin: extractAdmin(req),
    }),
  });

export { handler as GET, handler as POST };
