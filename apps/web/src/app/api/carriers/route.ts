import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

// GET /api/carriers
export async function GET() {
  try {
    const rows = await db
      .select()
      .from(schema.carriers)
      .orderBy(desc(schema.carriers.created_at))
      .limit(200);

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("GET /api/carriers error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/carriers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const [carrier] = await db
      .insert(schema.carriers)
      .values({
        name: body.name,
        contact_name: body.contact_name,
        contact_phone: body.contact_phone || "",
        contact_email: body.contact_email || null,
        telegram_id: body.telegram_id || null,
        description: body.description || null,
        status: (body.status || "active") as any,
      })
      .returning();

    return NextResponse.json(carrier, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/carriers error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/carriers
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(schema.carriers)
      .set({ ...data, updated_at: new Date() })
      .where(eq(schema.carriers.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/carriers error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/carriers
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await db.delete(schema.carriers).where(eq(schema.carriers.id, id));

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE /api/carriers error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
