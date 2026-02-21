import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Database } from "@cargo/db";
import type { AdminRole } from "@cargo/shared";

export type NotifyFn = (type: string, params: Record<string, any>) => Promise<void>;

export type Context = {
  db: Database;
  admin: {
    id: string;
    email: string;
    full_name: string;
    role: AdminRole;
  } | null;
  /** Revalidate Next.js ISR cache for a path (only available in Next.js context) */
  revalidate?: (path: string, type?: "page" | "layout") => void;
  /** Client IP for rate limiting (extracted from request headers) */
  clientIp?: string;
  /** Send a Telegram notification (fire-and-forget) */
  notify?: NotifyFn;
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

// Middleware: require authentication
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.admin) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({ ctx: { ...ctx, admin: ctx.admin } });
});

export const protectedProcedure = t.procedure.use(isAuthed);

// Middleware: require specific roles
export const withRole = (...roles: AdminRole[]) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.admin) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }
    if (!roles.includes(ctx.admin.role as AdminRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Insufficient permissions",
      });
    }
    return next({ ctx: { ...ctx, admin: ctx.admin } });
  });
