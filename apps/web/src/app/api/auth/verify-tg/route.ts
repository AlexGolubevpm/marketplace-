import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

const TG_AUTH_SECRET = process.env.TG_AUTH_SECRET || process.env.TELEGRAM_BOT_TOKEN || "";
const MAX_AGE_SECONDS = 600; // Links expire after 10 minutes

/**
 * GET /api/auth/verify-tg?tg_id=...&role=...&ts=...&sig=...
 * Verifies HMAC signature of Telegram auth URL.
 */
export async function GET(req: NextRequest) {
  const tgId = req.nextUrl.searchParams.get("tg_id");
  const role = req.nextUrl.searchParams.get("role");
  const ts = req.nextUrl.searchParams.get("ts");
  const sig = req.nextUrl.searchParams.get("sig");

  if (!tgId || !role || !ts || !sig || !TG_AUTH_SECRET) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  // Check timestamp freshness
  const timestamp = parseInt(ts, 10);
  const now = Math.floor(Date.now() / 1000);
  if (isNaN(timestamp) || now - timestamp > MAX_AGE_SECONDS) {
    return NextResponse.json({ error: "Link expired" }, { status: 403 });
  }

  // Verify HMAC signature
  const payload = `${tgId}:${role}:${ts}`;
  const expected = createHmac("sha256", TG_AUTH_SECRET).update(payload).digest("hex");

  // Constant-time comparison
  if (expected.length !== sig.length) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  if (result !== 0) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
