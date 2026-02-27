import { NextRequest, NextResponse } from "next/server";
import { notifyAdminCargoQuote } from "@/lib/telegram-admin-notify";

// Simple in-memory rate limiter (per IP, 5 requests per minute)
const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

// POST /api/cargo-quote
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRate(ip)) {
      return NextResponse.json(
        { error: "Слишком много запросов. Попробуйте через минуту." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, phone, email, originCity, destinationCity, cargo, weight, comment } = body;

    if (!name || (!phone && !email) || !cargo) {
      return NextResponse.json(
        { error: "Заполните имя, контакт и описание груза" },
        { status: 400 }
      );
    }

    const route = `${originCity || "Китай"} → ${destinationCity || "Россия"}`;

    // Send admin notification
    await notifyAdminCargoQuote({
      name,
      phone: phone || undefined,
      email: email || undefined,
      route,
      cargo,
      weight: weight || undefined,
      comment: comment || undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("POST /api/cargo-quote error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
