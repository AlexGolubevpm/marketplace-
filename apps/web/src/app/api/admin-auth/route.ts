import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signAdminSession } from "@/lib/admin-session";
import { BCRYPT_ROUNDS } from "@/lib/auth-config";

// POST /api/admin-auth — admin login
export async function POST(req: NextRequest) {
  try {
    const { login, password } = await req.json();

    if (!login || !password) {
      return NextResponse.json(
        { error: "Введите логин и пароль" },
        { status: 400 },
      );
    }

    // Find admin by email (login field is treated as email)
    const [existing] = await db
      .select({
        id: schema.admins.id,
        email: schema.admins.email,
        password_hash: schema.admins.password_hash,
        full_name: schema.admins.full_name,
        role: schema.admins.role,
        status: schema.admins.status,
      })
      .from(schema.admins)
      .where(eq(schema.admins.email, login))
      .limit(1);

    if (existing) {
      if (existing.status === "disabled") {
        return NextResponse.json(
          { error: "Аккаунт заблокирован" },
          { status: 403 },
        );
      }

      // Verify password with bcrypt
      const valid = await bcrypt.compare(password, existing.password_hash);
      if (!valid) {
        return NextResponse.json(
          { error: "Неверный логин или пароль" },
          { status: 401 },
        );
      }

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

    // Auto-seed: create default super_admin if no admins exist
    const [anyAdmin] = await db
      .select({ id: schema.admins.id })
      .from(schema.admins)
      .limit(1);

    if (!anyAdmin) {
      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const [admin] = await db
        .insert(schema.admins)
        .values({
          email: login,
          password_hash: hashedPassword,
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
    }

    return NextResponse.json(
      { error: "Неверный логин или пароль" },
      { status: 401 },
    );
  } catch (error: any) {
    console.error("POST /api/admin-auth error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
