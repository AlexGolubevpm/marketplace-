import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc, sql } from "drizzle-orm";

// GET /api/orders
export async function GET() {
  try {
    const rows = await db
      .select()
      .from(schema.orders)
      .orderBy(desc(schema.orders.created_at))
      .limit(200);

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("GET /api/orders error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/orders
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Generate display ID using MAX to avoid race-condition duplicates
    const year = new Date().getFullYear();
    const ordPrefix = `ORD-${year}-`;
    const [maxOrd] = await db
      .select({ maxId: sql<string>`COALESCE(MAX(display_id), '')` })
      .from(schema.orders)
      .where(sql`display_id LIKE ${ordPrefix + "%"}`);
    const lastOrdNum = maxOrd?.maxId
      ? parseInt(maxOrd.maxId.split("-").pop() || "0", 10)
      : 0;
    const display_id = `${ordPrefix}${String(lastOrdNum + 1).padStart(4, "0")}`;

    const [order] = await db
      .insert(schema.orders)
      .values({
        display_id,
        request_id: body.request_id,
        offer_id: body.offer_id,
        customer_id: body.customer_id,
        carrier_id: body.carrier_id,
        status: (body.status || "payment_pending") as any,
        price: String(body.price),
        currency: body.currency || "USD",
        tracking_number: body.tracking_number || null,
      })
      .returning();

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/orders error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/orders
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(schema.orders)
      .set({ ...data, updated_at: new Date() })
      .where(eq(schema.orders.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/orders error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
