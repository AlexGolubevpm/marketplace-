import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, or, desc, sql } from "drizzle-orm";

// Helper: resolve identifier to customer UUID (UUID, telegram_id, or email)
async function resolveCustomerId(identifier: string): Promise<string | null> {
  if (!identifier) return null;
  if (identifier.includes("-")) return identifier; // already a UUID
  // Try telegram_id first
  if (identifier && !/\s/.test(identifier)) {
    const [byTg] = await db
      .select({ id: schema.customers.id })
      .from(schema.customers)
      .where(eq(schema.customers.telegram_id, identifier))
      .limit(1);
    if (byTg) return byTg.id;
  }
  // Try email
  if (identifier.includes("@")) {
    const [byEmail] = await db
      .select({ id: schema.customers.id })
      .from(schema.customers)
      .where(eq(schema.customers.email, identifier))
      .limit(1);
    if (byEmail) return byEmail.id;
  }
  return null;
}

// Helper: resolve identifier to carrier UUID (UUID, telegram_id, or email)
async function resolveCarrierId(identifier: string): Promise<string | null> {
  if (!identifier) return null;
  if (identifier.includes("-")) return identifier; // already a UUID
  // Try telegram_id first
  if (identifier && !/\s/.test(identifier)) {
    const [byTg] = await db
      .select({ id: schema.carriers.id })
      .from(schema.carriers)
      .where(eq(schema.carriers.telegram_id, identifier))
      .limit(1);
    if (byTg) return byTg.id;
  }
  // Try email
  if (identifier.includes("@")) {
    const [byEmail] = await db
      .select({ id: schema.carriers.id })
      .from(schema.carriers)
      .where(eq(schema.carriers.contact_email, identifier))
      .limit(1);
    if (byEmail) return byEmail.id;
  }
  return null;
}

// Helper: resolve sender to UUID based on role
async function resolveSenderId(identifier: string, role: string): Promise<string | null> {
  if (!identifier) return null;
  if (identifier.includes("-")) return identifier; // already a UUID
  if (role === "customer") return resolveCustomerId(identifier);
  if (role === "carrier") return resolveCarrierId(identifier);
  return null;
}

// GET /api/chats?customer_id=xxx&carrier_id=xxx&request_id=xxx&conversation_id=xxx
export async function GET(req: NextRequest) {
  try {
    const conversationId = req.nextUrl.searchParams.get("conversation_id");
    const customerIdParam = req.nextUrl.searchParams.get("customer_id");
    const carrierIdParam = req.nextUrl.searchParams.get("carrier_id");
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

    // Resolve telegram_id to UUID if needed
    const customerId = customerIdParam ? await resolveCustomerId(customerIdParam) : null;
    const carrierId = carrierIdParam ? await resolveCarrierId(carrierIdParam) : null;

    // If param was provided but couldn't resolve, return empty list
    if (customerIdParam && !customerId) return NextResponse.json([]);
    if (carrierIdParam && !carrierId) return NextResponse.json([]);

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
      // Resolve sender telegram_id to UUID
      const senderId = await resolveSenderId(body.sender_id, body.sender_role);
      if (!senderId) {
        return NextResponse.json({ error: "Could not resolve sender" }, { status: 400 });
      }

      const [msg] = await db
        .insert(schema.messages)
        .values({
          conversation_id: body.conversation_id,
          sender_role: body.sender_role as any,
          sender_id: senderId,
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
    const { request_id, offer_id } = body;
    const resolvedCustomerId = body.customer_id ? await resolveCustomerId(body.customer_id) : null;
    const resolvedCarrierId = body.carrier_id ? await resolveCarrierId(body.carrier_id) : null;

    if (!request_id || !resolvedCustomerId || !resolvedCarrierId) {
      return NextResponse.json({ error: "request_id, customer_id, carrier_id required" }, { status: 400 });
    }

    // Check if conversation already exists
    const existing = await db
      .select()
      .from(schema.conversations)
      .where(
        and(
          eq(schema.conversations.request_id, request_id),
          eq(schema.conversations.customer_id, resolvedCustomerId),
          eq(schema.conversations.carrier_id, resolvedCarrierId)
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
        customer_id: resolvedCustomerId,
        carrier_id: resolvedCarrierId,
        offer_id: offer_id || null,
      })
      .returning();

    return NextResponse.json(convo, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/chats error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
