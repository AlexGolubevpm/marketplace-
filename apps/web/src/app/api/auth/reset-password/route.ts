import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { BCRYPT_ROUNDS, TOKEN_TTL_MS } from "@/lib/auth-config";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// POST /api/auth/reset-password
// body: { email, role? }
// Sends a password-reset email if the user exists.
export async function POST(req: NextRequest) {
  try {
    const { email: rawEmail, role = "customer" } = await req.json();

    if (!rawEmail) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    const email = rawEmail.trim().toLowerCase();

    // Always return success to prevent user enumeration
    const success = { message: "Если аккаунт существует, письмо отправлено" };

    let userId: string | null = null;
    let userName: string | null = null;

    if (role === "customer") {
      const [customer] = await db
        .select({ id: schema.customers.id, full_name: schema.customers.full_name })
        .from(schema.customers)
        .where(eq(schema.customers.email, email))
        .limit(1);

      if (!customer) return NextResponse.json(success);
      userId = customer.id;
      userName = customer.full_name;
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Generate a cryptographically random token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expires = new Date(Date.now() + TOKEN_TTL_MS);

    if (role === "customer") {
      await db
        .update(schema.customers)
        .set({ reset_token: tokenHash, reset_token_expires: expires })
        .where(eq(schema.customers.id, userId!));
    }

    const resetUrl = `${APP_URL}/auth/customer/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    if (process.env.SMTP_HOST) {
      const transporter = createTransport();
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Cargo Marketplace" <noreply@cargo.local>`,
        to: email,
        subject: "Сброс пароля — Cargo Marketplace",
        html: `
          <p>Здравствуйте, ${userName ?? ""}!</p>
          <p>Вы запросили сброс пароля. Нажмите кнопку ниже, ссылка действительна 1 час:</p>
          <p><a href="${resetUrl}" style="background:#06b6d4;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">Сбросить пароль</a></p>
          <p>Если вы не запрашивали сброс, просто проигнорируйте это письмо.</p>
        `,
      });
    } else {
      // Dev fallback: log the link
      console.log("[reset-password] Reset URL:", resetUrl);
    }

    return NextResponse.json(success);
  } catch (error: any) {
    console.error("POST /api/auth/reset-password error:", error.message);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

// PATCH /api/auth/reset-password
// body: { email, token, password, role? }
// Verifies the token and sets the new password.
export async function PATCH(req: NextRequest) {
  try {
    const { email: rawEmail, token, password, role = "customer" } = await req.json();

    if (!rawEmail || !token || !password) {
      return NextResponse.json({ error: "email, token, password required" }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Пароль должен быть не менее 8 символов" }, { status: 400 });
    }

    const email = rawEmail.trim().toLowerCase();
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    if (role === "customer") {
      const [customer] = await db
        .select({
          id: schema.customers.id,
          reset_token: schema.customers.reset_token,
          reset_token_expires: schema.customers.reset_token_expires,
        })
        .from(schema.customers)
        .where(eq(schema.customers.email, email))
        .limit(1);

      if (!customer) {
        return NextResponse.json({ error: "Неверный токен или email" }, { status: 400 });
      }

      if (
        !customer.reset_token ||
        !customer.reset_token_expires ||
        customer.reset_token !== tokenHash ||
        new Date() > customer.reset_token_expires
      ) {
        return NextResponse.json({ error: "Ссылка недействительна или истекла" }, { status: 400 });
      }

      const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      await db
        .update(schema.customers)
        .set({ password_hash, reset_token: null, reset_token_expires: null })
        .where(eq(schema.customers.id, customer.id));

      return NextResponse.json({ message: "Пароль успешно изменён" });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  } catch (error: any) {
    console.error("PATCH /api/auth/reset-password error:", error.message);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
