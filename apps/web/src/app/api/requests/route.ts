import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc, and, or, sql, inArray } from "drizzle-orm";

// Resolve a customer identifier (tg_id, email, or UUID) to a customer UUID
async function resolveCustomerId(identifier: string): Promise<string | null> {
  // Check if it's already a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(identifier)) {
    return identifier;
  }

  // Look up by telegram_id or email
  const customer = await db
    .select({ id: schema.customers.id })
    .from(schema.customers)
    .where(
      or(
        eq(schema.customers.telegram_id, identifier),
        eq(schema.customers.email, identifier)
      )
    )
    .limit(1);

  return customer[0]?.id || null;
}

// GET /api/requests?customer_id=xxx
export async function GET(req: NextRequest) {
  try {
    const customerIdentifier = req.nextUrl.searchParams.get("customer_id");

    const conditions = [];
    if (customerIdentifier) {
      const resolvedId = await resolveCustomerId(customerIdentifier);
      if (!resolvedId) {
        // No customer found — return empty list
        return NextResponse.json([]);
      }
      conditions.push(eq(schema.requests.customer_id, resolvedId));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: schema.requests.id,
        display_id: schema.requests.display_id,
        customer_id: schema.requests.customer_id,
        origin_country: schema.requests.origin_country,
        origin_city: schema.requests.origin_city,
        destination_country: schema.requests.destination_country,
        destination_city: schema.requests.destination_city,
        cargo_description: schema.requests.cargo_description,
        weight_kg: schema.requests.weight_kg,
        volume_m3: schema.requests.volume_m3,
        cargo_type: schema.requests.cargo_type,
        delivery_type_preferred: schema.requests.delivery_type_preferred,
        budget_min: schema.requests.budget_min,
        budget_max: schema.requests.budget_max,
        status: schema.requests.status,
        source: schema.requests.source,
        sla_violated: schema.requests.sla_violated,
        created_at: schema.requests.created_at,
        updated_at: schema.requests.updated_at,
        customer_name: schema.customers.full_name,
        customer_company: schema.customers.company_name,
        customer_email: schema.customers.email,
        customer_phone: schema.customers.phone,
      })
      .from(schema.requests)
      .leftJoin(schema.customers, eq(schema.requests.customer_id, schema.customers.id))
      .where(where)
      .orderBy(desc(schema.requests.created_at))
      .limit(100);

    // Get offer counts
    const requestIds = rows.map((r) => r.id);
    let offerCounts: Record<string, number> = {};
    if (requestIds.length > 0) {
      const counts = await db
        .select({
          request_id: schema.offers.request_id,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.offers)
        .where(inArray(schema.offers.request_id, requestIds))
        .groupBy(schema.offers.request_id);

      offerCounts = Object.fromEntries(counts.map((c) => [c.request_id, c.count]));
    }

    const data = rows.map((r) => ({
      ...r,
      offer_count: offerCounts[r.id] || 0,
    }));

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET /api/requests error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/requests
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Generate display ID using MAX to avoid race-condition duplicates
    const year = new Date().getFullYear();
    const prefix = `REQ-${year}-`;
    const [maxResult] = await db
      .select({ maxId: sql<string>`COALESCE(MAX(display_id), '')` })
      .from(schema.requests)
      .where(sql`display_id LIKE ${prefix + "%"}`);
    const lastNum = maxResult?.maxId
      ? parseInt(maxResult.maxId.split("-").pop() || "0", 10)
      : 0;
    const display_id = `${prefix}${String(lastNum + 1).padStart(4, "0")}`;

    // Resolve customer: find existing or create new
    let customerId: string;
    const identifier = body.customer_id || "";
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(identifier)) {
      // Already a UUID — use directly, ensure customer record exists
      customerId = identifier;
      const existing = await db
        .select()
        .from(schema.customers)
        .where(eq(schema.customers.id, customerId))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(schema.customers).values({
          id: customerId,
          email: body.customer_email || null,
          full_name: body.customer_name || null,
          status: "active" as any,
        }).onConflictDoNothing();
      }
    } else {
      // Non-UUID identifier (tg_id or email) — look up or create customer
      const isEmail = identifier.includes("@");

      const existing = await db
        .select()
        .from(schema.customers)
        .where(
          isEmail
            ? eq(schema.customers.email, identifier)
            : eq(schema.customers.telegram_id, identifier)
        )
        .limit(1);

      if (existing.length > 0) {
        customerId = existing[0].id;
      } else {
        // Create new customer with auto-generated UUID
        const [newCustomer] = await db
          .insert(schema.customers)
          .values({
            telegram_id: !isEmail ? identifier : null,
            email: isEmail ? identifier : (body.customer_email || null),
            full_name: body.customer_name || null,
            status: "active" as any,
          })
          .returning();
        customerId = newCustomer.id;
      }
    }

    const [request] = await db
      .insert(schema.requests)
      .values({
        display_id,
        customer_id: customerId,
        origin_country: body.origin_country,
        origin_city: body.origin_city,
        destination_country: body.destination_country,
        destination_city: body.destination_city,
        cargo_description: body.cargo_description,
        weight_kg: body.weight_kg || null,
        volume_m3: body.volume_m3 || null,
        cargo_type: body.cargo_type || null,
        delivery_type_preferred: body.delivery_type_preferred || null,
        budget_min: body.budget_min || null,
        budget_max: body.budget_max || null,
        status: "new" as any,
        offer_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
        source: (body.source || "web_form") as any,
        sla_violated: false,
      })
      .returning();

    // Update status to matching after a moment
    setTimeout(async () => {
      try {
        await db
          .update(schema.requests)
          .set({ status: "matching" as any, updated_at: new Date() })
          .where(eq(schema.requests.id, request.id));
      } catch {}
    }, 2000);

    return NextResponse.json(request, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/requests error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
