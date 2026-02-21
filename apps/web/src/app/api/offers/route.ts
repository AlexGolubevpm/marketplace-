import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, or, sql, desc } from "drizzle-orm";

// Resolve a carrier identifier (tg_id, email, or UUID) to a carrier UUID
async function resolveCarrierId(identifier: string): Promise<string | null> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(identifier)) {
    return identifier;
  }

  const carrier = await db
    .select({ id: schema.carriers.id })
    .from(schema.carriers)
    .where(
      or(
        eq(schema.carriers.telegram_id, identifier),
        eq(schema.carriers.contact_email, identifier)
      )
    )
    .limit(1);

  return carrier[0]?.id || null;
}

// GET /api/offers?request_id=xxx&carrier_id=xxx
export async function GET(req: NextRequest) {
  try {
    const requestId = req.nextUrl.searchParams.get("request_id");
    const carrierIdentifier = req.nextUrl.searchParams.get("carrier_id");

    const conditions = [];
    if (requestId) conditions.push(eq(schema.offers.request_id, requestId));
    if (carrierIdentifier) {
      const resolvedId = await resolveCarrierId(carrierIdentifier);
      if (!resolvedId) {
        return NextResponse.json([]);
      }
      conditions.push(eq(schema.offers.carrier_id, resolvedId));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: schema.offers.id,
        display_id: schema.offers.display_id,
        request_id: schema.offers.request_id,
        carrier_id: schema.offers.carrier_id,
        price: schema.offers.price,
        currency: schema.offers.currency,
        estimated_days: schema.offers.estimated_days,
        delivery_type: schema.offers.delivery_type,
        conditions: schema.offers.conditions,
        status: schema.offers.status,
        selected_at: schema.offers.selected_at,
        created_at: schema.offers.created_at,
        carrier_name: schema.carriers.name,
        carrier_contact: schema.carriers.contact_name,
        carrier_phone: schema.carriers.contact_phone,
        carrier_email: schema.carriers.contact_email,
      })
      .from(schema.offers)
      .leftJoin(schema.carriers, eq(schema.offers.carrier_id, schema.carriers.id))
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

    // Generate display ID using MAX to avoid race-condition duplicates
    const year = new Date().getFullYear();
    const offPrefix = `OFF-${year}-`;
    const [maxOff] = await db
      .select({ maxId: sql<string>`COALESCE(MAX(display_id), '')` })
      .from(schema.offers)
      .where(sql`display_id LIKE ${offPrefix + "%"}`);
    const lastOffNum = maxOff?.maxId
      ? parseInt(maxOff.maxId.split("-").pop() || "0", 10)
      : 0;
    const display_id = `${offPrefix}${String(lastOffNum + 1).padStart(4, "0")}`;

    // Resolve carrier: find existing or create new
    let carrierId: string;
    const carrierIdentifier = body.carrier_id || "";
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(carrierIdentifier)) {
      carrierId = carrierIdentifier;
      const existing = await db
        .select()
        .from(schema.carriers)
        .where(eq(schema.carriers.id, carrierId))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(schema.carriers).values({
          id: carrierId,
          name: body.carrier_name || "Carrier",
          contact_name: body.carrier_name || "Contact",
          contact_phone: "",
          contact_email: body.carrier_email || null,
          status: "active" as any,
        }).onConflictDoNothing();
      }
    } else {
      // Non-UUID identifier (tg_id or email) — look up or create carrier
      const isEmail = carrierIdentifier.includes("@");

      const existing = await db
        .select()
        .from(schema.carriers)
        .where(
          isEmail
            ? eq(schema.carriers.contact_email, carrierIdentifier)
            : eq(schema.carriers.telegram_id, carrierIdentifier)
        )
        .limit(1);

      if (existing.length > 0) {
        carrierId = existing[0].id;
      } else {
        const [newCarrier] = await db
          .insert(schema.carriers)
          .values({
            telegram_id: !isEmail ? carrierIdentifier : null,
            contact_email: isEmail ? carrierIdentifier : (body.carrier_email || null),
            name: body.carrier_name || "Carrier",
            contact_name: body.carrier_name || "Contact",
            contact_phone: "",
            status: "active" as any,
          })
          .returning();
        carrierId = newCarrier.id;
      }
    }

    const [offer] = await db
      .insert(schema.offers)
      .values({
        display_id,
        request_id: body.request_id,
        carrier_id: carrierId,
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
        const ordYear = new Date().getFullYear();
        const ordPrefix = `ORD-${ordYear}-`;
        const [maxOrd] = await db
          .select({ maxId: sql<string>`COALESCE(MAX(display_id), '')` })
          .from(schema.orders)
          .where(sql`display_id LIKE ${ordPrefix + "%"}`);
        const lastOrdNum = maxOrd?.maxId
          ? parseInt(maxOrd.maxId.split("-").pop() || "0", 10)
          : 0;
        const orderDisplayId = `${ordPrefix}${String(lastOrdNum + 1).padStart(4, "0")}`;

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
