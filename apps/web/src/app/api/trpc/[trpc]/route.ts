import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { revalidatePath } from "next/cache";
import { appRouter, type Context } from "@cargo/api";
import { verifyAdminSession } from "@/lib/admin-session";
import { sendTelegramMessage } from "@/lib/telegram-notify";
import * as tgNotify from "@/lib/telegram-notify";

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
    // Decode Base64 (client encodes to avoid non-ISO-8859-1 in headers)
    let raw: string;
    try {
      raw = decodeURIComponent(escape(atob(header)));
    } catch {
      // Fallback: header might be plain JSON (old clients)
      raw = header;
    }
    const session = JSON.parse(raw);
    if (!session.logged_in) return null;
    if (!session.id) return null;

    // Verify HMAC signature — reject tampered sessions
    if (
      !session.sig ||
      !verifyAdminSession(
        { id: session.id, email: session.email || "", role: session.role || "" },
        session.sig
      )
    ) {
      console.warn("[tRPC] Admin session HMAC verification failed");
      return null;
    }

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

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
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
      return {
        db: database,
        admin,
        revalidate: revalidatePath,
        clientIp: getClientIp(req),
        notify: async (type: string, params: Record<string, any>) => {
          try {
            switch (type) {
              case "request_status_changed":
                await tgNotify.notifyRequestStatusChanged(params as any);
                break;
              case "new_offer":
                await tgNotify.notifyNewOffer(params as any);
                break;
              case "order_status_changed":
                await tgNotify.notifyOrderStatusChanged(params as any);
                break;
              case "new_message":
                await tgNotify.notifyNewMessage(params as any);
                break;
              case "carrier_new_request":
                await tgNotify.notifyCarrierNewRequest(params as any);
                break;
            }
          } catch (err) {
            console.error("[tRPC notify] Error:", err);
          }
        },
      };
    },
    onError: ({ path, error }) => {
      console.error(`[tRPC] Error in ${path}:`, error.message);
    },
  });

export { handler as GET, handler as POST };
