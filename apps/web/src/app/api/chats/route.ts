import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, or, desc, sql } from "drizzle-orm";

// GET /api/chats?customer_id=xxx&carrier_id=xxx&request_id=xxx&conversation_id=xxx
export async function GET(req: NextRequest) {
  try {
    const conversationId = req.nextUrl.searchParams.get("conversation_id");
    const customerId = req.nextUrl.searchParams.get("customer_id");
    const carrierId = req.nextUrl.searchParams.get("carrier_id");
    const requestId = req.nextUrl.searchParams.get("request_id");
    const allChats = req.nextUrl.searchParams.get("all");

    // If conversation_id is provided, return messages for that conversation
    if (conversationId) {
      const msgs = await db
        .select()
        .from(schema.messages)
        .where(eq(schema.messages.conversation_id, conversationId))
        .orderBy(schema.messages.created_at);
      return NextResponse.json(msgs);
    }

    // Otherwise, return conversation list
    const conditions = [];
    if (customerId) conditions.push(eq(schema.conversations.customer_id, customerId));
    if (carrierId) conditions.push(eq(schema.conversations.carrier_id, carrierId));
    if (requestId) conditions.push(eq(schema.conversations.request_id, requestId));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const convos = await db
      .select()
      .from(schema.conversations)
      .where(where)
      .orderBy(desc(schema.conversations.updated_at))
      .limit(100);

    // Enrich with participant names and last message
    const enriched = await Promise.all(
      convos.map(async (c) => {
        const [customer] = await db
          .select({ full_name: schema.customers.full_name, company_name: schema.customers.company_name })
          .from(schema.customers)
          .where(eq(schema.customers.id, c.customer_id))
          .limit(1);
        const [carrier] = await db
          .select({ name: schema.carriers.name })
          .from(schema.carriers)
          .where(eq(schema.carriers.id, c.carrier_id))
          .limit(1);
        const [lastMsg] = await db
          .select()
          .from(schema.messages)
          .where(eq(schema.messages.conversation_id, c.id))
          .orderBy(desc(schema.messages.created_at))
          .limit(1);
        const [request] = await db
          .select({ display_id: schema.requests.display_id, origin_city: schema.requests.origin_city, destination_city: schema.requests.destination_city })
          .from(schema.requests)
          .where(eq(schema.requests.id, c.request_id))
          .limit(1);

        return {
          ...c,
          customer_name: customer?.full_name || customer?.company_name || "Клиент",
          carrier_name: carrier?.name || "Карго",
          request_display_id: request?.display_id || "",
          request_route: request ? `${request.origin_city} → ${request.destination_city}` : "",
          last_message: lastMsg || null,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error("GET /api/chats error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/chats — create conversation or send message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // If conversation_id is provided, add a message
    if (body.conversation_id) {
      const [msg] = await db
        .insert(schema.messages)
        .values({
          conversation_id: body.conversation_id,
          sender_role: body.sender_role as any,
          sender_id: body.sender_id,
          text: body.text || null,
          file_url: body.file_url || null,
          file_name: body.file_name || null,
        })
        .returning();

      // Update conversation updated_at
      await db
        .update(schema.conversations)
        .set({ updated_at: new Date() })
        .where(eq(schema.conversations.id, body.conversation_id));

      return NextResponse.json(msg, { status: 201 });
    }

    // Otherwise, create or find a conversation
    const { request_id, customer_id, carrier_id, offer_id } = body;

    if (!request_id || !customer_id || !carrier_id) {
      return NextResponse.json({ error: "request_id, customer_id, carrier_id required" }, { status: 400 });
    }

    // Check if conversation already exists
    const existing = await db
      .select()
      .from(schema.conversations)
      .where(
        and(
          eq(schema.conversations.request_id, request_id),
          eq(schema.conversations.customer_id, customer_id),
          eq(schema.conversations.carrier_id, carrier_id)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(existing[0]);
    }

    // Create new conversation
    const [convo] = await db
      .insert(schema.conversations)
      .values({
        request_id,
        customer_id,
        carrier_id,
        offer_id: offer_id || null,
      })
      .returning();

    return NextResponse.json(convo, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/chats error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
