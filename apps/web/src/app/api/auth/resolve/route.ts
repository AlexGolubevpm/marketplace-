import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

// GET /api/auth/resolve?tg_id=xxx&role=customer|carrier
// Resolves a telegram_id to the database UUID
export async function GET(req: NextRequest) {
  try {
    const tgId = req.nextUrl.searchParams.get("tg_id");
    const role = req.nextUrl.searchParams.get("role");

    if (!tgId || !role) {
      return NextResponse.json({ error: "tg_id and role required" }, { status: 400 });
    }

    if (role === "customer") {
      const [customer] = await db
        .select({ id: schema.customers.id })
        .from(schema.customers)
        .where(eq(schema.customers.telegram_id, tgId))
        .limit(1);
      return NextResponse.json({ user_id: customer?.id || "" });
    }

    if (role === "carrier") {
      const [carrier] = await db
        .select({ id: schema.carriers.id })
        .from(schema.carriers)
        .where(eq(schema.carriers.telegram_id, tgId))
        .limit(1);
      return NextResponse.json({ user_id: carrier?.id || "" });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  } catch (error: any) {
    console.error("GET /api/auth/resolve error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
