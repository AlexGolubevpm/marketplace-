import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

const SESSION_SECRET = process.env.JWT_SECRET || "fallback-dev-secret";

/** Create HMAC-SHA256 signature of session payload. */
export function signAdminSession(data: { id: string; email: string; full_name: string; role: string }): string {
  const payload = `${data.id}:${data.email}:${data.role}`;
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

/** Verify HMAC signature. */
export function verifyAdminSession(
  data: { id: string; email: string; role: string },
  signature: string
): boolean {
  const expected = createHmac("sha256", SESSION_SECRET)
    .update(`${data.id}:${data.email}:${data.role}`)
    .digest("hex");
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}

// POST /api/admin-auth — admin login with DB record bootstrap
export async function POST(req: NextRequest) {
  try {
    const { login, password } = await req.json();

    // Hardcoded credentials check
    if (login !== "admin" || password !== "admin123") {
      return NextResponse.json(
        { error: "Неверный логин или пароль" },
        { status: 401 },
      );
    }

    const email = "admin@cargo.local";

    // Find existing admin
    const [existing] = await db
      .select({
        id: schema.admins.id,
        email: schema.admins.email,
        full_name: schema.admins.full_name,
        role: schema.admins.role,
        status: schema.admins.status,
      })
      .from(schema.admins)
      .where(eq(schema.admins.email, email))
      .limit(1);

    if (existing) {
      // Update last_login_at
      await db
        .update(schema.admins)
        .set({ last_login_at: new Date() })
        .where(eq(schema.admins.id, existing.id));

      const sig = signAdminSession(existing);
      return NextResponse.json({
        id: existing.id,
        email: existing.email,
        full_name: existing.full_name,
        role: existing.role,
        sig,
      });
    }

    // Auto-seed: create the default super_admin record
    const [admin] = await db
      .insert(schema.admins)
      .values({
        email,
        password_hash: "admin123",
        full_name: "Администратор",
        role: "super_admin",
        status: "active",
        last_login_at: new Date(),
      })
      .returning({
        id: schema.admins.id,
        email: schema.admins.email,
        full_name: schema.admins.full_name,
        role: schema.admins.role,
      });

    const sig = signAdminSession(admin);
    return NextResponse.json({ ...admin, sig });
  } catch (error: any) {
    console.error("POST /api/admin-auth error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
