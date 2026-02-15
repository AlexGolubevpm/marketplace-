import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

// GET /api/documents?order_id=...
export async function GET(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get("order_id");
    if (!orderId) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const docs = await db
      .select()
      .from(schema.orderDocuments)
      .where(eq(schema.orderDocuments.order_id, orderId));

    return NextResponse.json(docs);
  } catch (error: any) {
    console.error("GET /api/documents error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/documents
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.order_id || !body.file_name || !body.file_url) {
      return NextResponse.json(
        { error: "order_id, file_name, and file_url are required" },
        { status: 400 }
      );
    }

    const [doc] = await db
      .insert(schema.orderDocuments)
      .values({
        order_id: body.order_id,
        file_name: body.file_name,
        file_url: body.file_url,
        file_type: (body.file_type || "other") as any,
        uploaded_by: body.uploaded_by || null,
        uploaded_by_role: body.uploaded_by_role || "customer",
      })
      .returning();

    return NextResponse.json(doc, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/documents error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
