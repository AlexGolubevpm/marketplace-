import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc, sql } from "drizzle-orm";

// GET /api/customers
export async function GET() {
  try {
    const rows = await db
      .select()
      .from(schema.customers)
      .orderBy(desc(schema.customers.created_at))
      .limit(200);

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("GET /api/customers error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/customers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const [customer] = await db
      .insert(schema.customers)
      .values({
        telegram_id: body.telegram_id || null,
        telegram_username: body.telegram_username || null,
        phone: body.phone || null,
        email: body.email || null,
        full_name: body.full_name || null,
        company_name: body.company_name || null,
        status: (body.status || "active") as any,
        notes: body.notes || null,
      })
      .returning();

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/customers error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/customers
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(schema.customers)
      .set({ ...data, updated_at: new Date() })
      .where(eq(schema.customers.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/customers error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/customers
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await db.delete(schema.customers).where(eq(schema.customers.id, id));

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE /api/customers error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
