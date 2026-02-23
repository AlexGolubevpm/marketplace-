import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS, validateEmail } from "@/lib/auth-config";

// POST /api/auth — login or register by email for customer/carrier
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email: rawEmail, password, role, mode, name, company } = body;

    if (!rawEmail || !password || !role) {
      return NextResponse.json({ error: "email, password, role required" }, { status: 400 });
    }

    const email = rawEmail.trim().toLowerCase();

    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Некорректный формат email" }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Пароль должен быть не менее 8 символов" }, { status: 400 });
    }

    if (role === "customer") {
      if (mode === "register") {
        const [existing] = await db
          .select({ id: schema.customers.id })
          .from(schema.customers)
          .where(eq(schema.customers.email, email))
          .limit(1);

        if (existing) {
          return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 409 });
        }

        const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

        const [customer] = await db
          .insert(schema.customers)
          .values({
            email,
            password_hash,
            full_name: name || email.split("@")[0],
            company_name: company || null,
          })
          .returning({ id: schema.customers.id, full_name: schema.customers.full_name });

        return NextResponse.json({ user_id: customer.id, name: customer.full_name });
      }

      // Login
      const [customer] = await db
        .select({
          id: schema.customers.id,
          full_name: schema.customers.full_name,
          password_hash: schema.customers.password_hash,
        })
        .from(schema.customers)
        .where(eq(schema.customers.email, email))
        .limit(1);

      if (!customer || !customer.password_hash) {
        return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
      }

      const valid = await bcrypt.compare(password, customer.password_hash);
      if (!valid) {
        return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
      }

      return NextResponse.json({ user_id: customer.id, name: customer.full_name });
    }

    if (role === "carrier") {
      if (mode === "register") {
        const [existing] = await db
          .select({ id: schema.carriers.id })
          .from(schema.carriers)
          .where(eq(schema.carriers.contact_email, email))
          .limit(1);

        if (existing) {
          return NextResponse.json({ error: "Карго с таким email уже существует" }, { status: 409 });
        }

        const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

        const [carrier] = await db
          .insert(schema.carriers)
          .values({
            contact_email: email,
            password_hash,
            name: company || email.split("@")[0],
            contact_name: name || email.split("@")[0],
            contact_phone: body.phone || "",
          })
          .returning({ id: schema.carriers.id, name: schema.carriers.name });

        return NextResponse.json({ user_id: carrier.id, name: carrier.name });
      }

      // Login
      const [carrier] = await db
        .select({
          id: schema.carriers.id,
          name: schema.carriers.name,
          password_hash: schema.carriers.password_hash,
        })
        .from(schema.carriers)
        .where(eq(schema.carriers.contact_email, email))
        .limit(1);

      if (!carrier || !carrier.password_hash) {
        return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
      }

      const valid = await bcrypt.compare(password, carrier.password_hash);
      if (!valid) {
        return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
      }

      return NextResponse.json({ user_id: carrier.id, name: carrier.name });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/auth error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
