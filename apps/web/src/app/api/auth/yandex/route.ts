import { NextRequest, NextResponse } from "next/server";

const YANDEX_CLIENT_ID = process.env.YANDEX_CLIENT_ID!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// GET /api/auth/yandex?role=customer|carrier
// Redirects the user to Yandex OAuth authorization page
export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role") ?? "customer";

  if (!YANDEX_CLIENT_ID) {
    return NextResponse.json({ error: "Yandex OAuth not configured" }, { status: 503 });
  }

  const redirectUri = `${APP_URL}/api/auth/yandex/callback`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: YANDEX_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "login:email login:info login:avatar",
    state: role, // pass role through state param (for callback to know where to redirect)
    force_confirm: "no",
  });

  return NextResponse.redirect(`https://oauth.yandex.ru/authorize?${params.toString()}`);
}
