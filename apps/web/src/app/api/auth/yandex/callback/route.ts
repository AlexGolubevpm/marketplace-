import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { notifyAdminNewCustomer } from "@/lib/telegram-admin-notify";

const YANDEX_CLIENT_ID = process.env.YANDEX_CLIENT_ID!;
const YANDEX_CLIENT_SECRET = process.env.YANDEX_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface YandexToken {
  access_token: string;
  token_type: string;
}

interface YandexUserInfo {
  id: string;
  login: string;
  real_name: string;
  default_email: string;
  default_avatar_id: string;
  is_avatar_empty: boolean;
}

async function exchangeCodeForToken(code: string): Promise<YandexToken> {
  const redirectUri = `${APP_URL}/api/auth/yandex/callback`;

  const res = await fetch("https://oauth.yandex.ru/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: YANDEX_CLIENT_ID,
      client_secret: YANDEX_CLIENT_SECRET,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Yandex token exchange failed: ${err}`);
  }

  return res.json();
}

async function getUserInfo(accessToken: string): Promise<YandexUserInfo> {
  const res = await fetch("https://login.yandex.ru/info?format=json", {
    headers: { Authorization: `OAuth ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Yandex user info");
  }

  return res.json();
}

// GET /api/auth/yandex/callback?code=xxx&state=customer|carrier
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state") ?? "customer";
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    const redirectPath = state === "carrier" ? "/auth/carrier" : "/auth/customer";
    return NextResponse.redirect(`${APP_URL}${redirectPath}?error=yandex_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/auth/customer?error=no_code`);
  }

  if (!YANDEX_CLIENT_ID || !YANDEX_CLIENT_SECRET) {
    return NextResponse.redirect(`${APP_URL}/auth/customer?error=not_configured`);
  }

  try {
    const token = await exchangeCodeForToken(code);
    const yandexUser = await getUserInfo(token.access_token);

    const yandexId = yandexUser.id;
    const email = yandexUser.default_email?.trim().toLowerCase();
    const fullName = yandexUser.real_name || yandexUser.login;
    const avatarUrl = yandexUser.is_avatar_empty
      ? null
      : `https://avatars.yandex.net/get-yapic/${yandexUser.default_avatar_id}/islands-200`;

    if (state === "customer") {
      // Find by yandex_id first, then by email
      let customer =
        (
          await db
            .select({ id: schema.customers.id, full_name: schema.customers.full_name })
            .from(schema.customers)
            .where(eq(schema.customers.yandex_id, yandexId))
            .limit(1)
        )[0] ?? null;

      if (!customer && email) {
        const byEmail = await db
          .select({ id: schema.customers.id, full_name: schema.customers.full_name })
          .from(schema.customers)
          .where(eq(schema.customers.email, email))
          .limit(1);

        if (byEmail[0]) {
          // Link existing account
          await db
            .update(schema.customers)
            .set({ yandex_id: yandexId, avatar_url: avatarUrl ?? undefined })
            .where(eq(schema.customers.id, byEmail[0].id));
          customer = byEmail[0];
        }
      }

      if (!customer) {
        // Create new customer
        const [created] = await db
          .insert(schema.customers)
          .values({
            email: email || null,
            yandex_id: yandexId,
            full_name: fullName,
            avatar_url: avatarUrl ?? null,
            email_verified: !!email,
          })
          .returning({ id: schema.customers.id, full_name: schema.customers.full_name });
        customer = created;

        // Admin notification (fire and forget)
        notifyAdminNewCustomer({
          customerId: customer.id,
          name: fullName || undefined,
          email: email || undefined,
          source: "Яндекс OAuth",
        }).catch(() => {});
      }

      // Encode session payload into redirect URL (picked up by client-side setSession)
      const params = new URLSearchParams({
        oauth: "yandex",
        user_id: customer.id,
        name: customer.full_name || fullName,
        role: "customer",
      });
      return NextResponse.redirect(`${APP_URL}/auth/customer/oauth-success?${params.toString()}`);
    }

    // carrier role
    return NextResponse.redirect(`${APP_URL}/auth/carrier?error=yandex_not_supported_for_carriers`);
  } catch (err: any) {
    console.error("Yandex OAuth callback error:", err.message);
    const redirectPath = state === "carrier" ? "/auth/carrier" : "/auth/customer";
    return NextResponse.redirect(`${APP_URL}${redirectPath}?error=yandex_failed`);
  }
}
