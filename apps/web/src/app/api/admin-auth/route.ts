import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

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

      return NextResponse.json({
        id: existing.id,
        email: existing.email,
        full_name: existing.full_name,
        role: existing.role,
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

    return NextResponse.json(admin);
  } catch (error: any) {
    console.error("POST /api/admin-auth error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
