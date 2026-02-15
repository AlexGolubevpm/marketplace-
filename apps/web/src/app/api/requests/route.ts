import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc, and, sql } from "drizzle-orm";

// GET /api/requests?customer_id=xxx
export async function GET(req: NextRequest) {
  try {
    const customerId = req.nextUrl.searchParams.get("customer_id");

    const conditions = [];
    if (customerId) {
      conditions.push(eq(schema.requests.customer_id, customerId));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select()
      .from(schema.requests)
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
        .where(sql`${schema.offers.request_id} = ANY(${requestIds})`)
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

    // Generate display ID
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.requests);
    const num = (countResult[0]?.count || 0) + 1;
    const display_id = `REQ-${new Date().getFullYear()}-${String(num).padStart(4, "0")}`;

    // Ensure customer exists (create if not)
    if (body.customer_id) {
      const existing = await db
        .select()
        .from(schema.customers)
        .where(eq(schema.customers.id, body.customer_id))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(schema.customers).values({
          id: body.customer_id,
          email: body.customer_email || null,
          full_name: body.customer_name || null,
          status: "active" as any,
        }).onConflictDoNothing();
      }
    }

    const [request] = await db
      .insert(schema.requests)
      .values({
        display_id,
        customer_id: body.customer_id,
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
