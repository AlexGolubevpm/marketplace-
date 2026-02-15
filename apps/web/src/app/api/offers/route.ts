import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, sql, desc } from "drizzle-orm";

// GET /api/offers?request_id=xxx&carrier_id=xxx
export async function GET(req: NextRequest) {
  try {
    const requestId = req.nextUrl.searchParams.get("request_id");
    const carrierId = req.nextUrl.searchParams.get("carrier_id");

    const conditions = [];
    if (requestId) conditions.push(eq(schema.offers.request_id, requestId));
    if (carrierId) conditions.push(eq(schema.offers.carrier_id, carrierId));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select()
      .from(schema.offers)
      .where(where)
      .orderBy(desc(schema.offers.created_at))
      .limit(100);

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("GET /api/offers error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/offers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Generate display ID
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.offers);
    const num = (countResult[0]?.count || 0) + 1;
    const display_id = `OFF-${new Date().getFullYear()}-${String(num).padStart(4, "0")}`;

    // Ensure carrier exists
    if (body.carrier_id) {
      const existing = await db
        .select()
        .from(schema.carriers)
        .where(eq(schema.carriers.id, body.carrier_id))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(schema.carriers).values({
          id: body.carrier_id,
          name: body.carrier_name || "Carrier",
          contact_name: body.carrier_name || "Contact",
          contact_phone: "",
          contact_email: body.carrier_email || null,
          status: "active" as any,
        }).onConflictDoNothing();
      }
    }

    const [offer] = await db
      .insert(schema.offers)
      .values({
        display_id,
        request_id: body.request_id,
        carrier_id: body.carrier_id,
        price: String(body.price),
        currency: body.currency || "USD",
        estimated_days: body.estimated_days || body.estimated_days_min || 14,
        delivery_type: (body.delivery_type || "sea") as any,
        conditions: body.conditions || null,
        status: "active" as any,
        is_editable: true,
      })
      .returning();

    // Update request status to offers_received
    await db
      .update(schema.requests)
      .set({ status: "offers_received" as any, updated_at: new Date() })
      .where(
        and(
          eq(schema.requests.id, body.request_id),
          sql`${schema.requests.status} IN ('new', 'matching')`
        )
      );

    // Push SSE event
    if (typeof globalThis !== "undefined") {
      const listeners = (globalThis as any).__sseListeners as Map<string, Set<(data: string) => void>> | undefined;
      if (listeners) {
        const requestListeners = listeners.get(body.request_id);
        if (requestListeners) {
          const eventData = JSON.stringify({
            type: "offer.received",
            offer: { ...offer, carrier_name: body.carrier_name },
            request_id: body.request_id,
          });
          requestListeners.forEach((send) => send(eventData));
        }
      }
    }

    return NextResponse.json(offer, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/offers error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/offers (select offer)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { offer_id, action } = body;

    if (action === "select") {
      // Mark this offer as selected
      const [offer] = await db
        .update(schema.offers)
        .set({ status: "selected" as any, selected_at: new Date(), is_editable: false, updated_at: new Date() })
        .where(eq(schema.offers.id, offer_id))
        .returning();

      if (offer) {
        // Reject other offers for same request
        await db
          .update(schema.offers)
          .set({ status: "rejected" as any, updated_at: new Date() })
          .where(
            and(
              eq(schema.offers.request_id, offer.request_id),
              sql`${schema.offers.id} != ${offer_id}`,
              eq(schema.offers.status, "active" as any)
            )
          );

        // Update request status
        await db
          .update(schema.requests)
          .set({ status: "offer_selected" as any, updated_at: new Date() })
          .where(eq(schema.requests.id, offer.request_id));

        // Create order
        const orderCount = await db.select({ count: sql<number>`count(*)::int` }).from(schema.orders);
        const orderNum = (orderCount[0]?.count || 0) + 1;
        const orderDisplayId = `ORD-${new Date().getFullYear()}-${String(orderNum).padStart(4, "0")}`;

        // Get request to find customer_id
        const [request] = await db.select().from(schema.requests).where(eq(schema.requests.id, offer.request_id)).limit(1);

        if (request) {
          await db.insert(schema.orders).values({
            display_id: orderDisplayId,
            request_id: offer.request_id,
            offer_id: offer.id,
            customer_id: request.customer_id,
            carrier_id: offer.carrier_id,
            status: "confirmed" as any,
            price: offer.price,
            currency: offer.currency,
          });
        }
      }

      return NextResponse.json(offer);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("PATCH /api/offers error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
