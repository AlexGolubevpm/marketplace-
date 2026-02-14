import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, type Context } from "@cargo/api";
import { db } from "@cargo/db";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: (): Context => ({
      db,
      admin: null, // TODO: Extract admin from JWT in production
    }),
  });

export { handler as GET, handler as POST };
