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

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: (): Context => ({
      db: getDb(),
      admin: null, // TODO: Extract admin from JWT in production
    }),
  });

export { handler as GET, handler as POST };
