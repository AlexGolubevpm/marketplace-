import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

// GET /api/requests/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [request] = await db
      .select()
      .from(schema.requests)
      .where(eq(schema.requests.id, id))
      .limit(1);

    if (!request) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Get offers for this request
    const offers = await db
      .select()
      .from(schema.offers)
      .where(eq(schema.offers.request_id, id));

    // Get order if exists (created when offer is selected)
    const [order] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.request_id, id))
      .limit(1);

    // Get documents for order
    let documents: any[] = [];
    if (order) {
      documents = await db
        .select()
        .from(schema.orderDocuments)
        .where(eq(schema.orderDocuments.order_id, order.id));
    }

    return NextResponse.json({ ...request, offers, offer_count: offers.length, order: order || null, documents });
  } catch (error: any) {
    console.error("GET /api/requests/[id] error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/requests/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const [updated] = await db
      .update(schema.requests)
      .set({ ...body, updated_at: new Date() })
      .where(eq(schema.requests.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/requests/[id] error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
