"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Mail, Lock, User, Building } from "lucide-react";
import { setSession } from "@/lib/auth";

function YandexIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.875 3H10.5C8.016 3 6 5.016 6 7.5c0 2.063 1.313 3.656 3.188 4.219L6 21h2.625l3-8.625h.75V21H15V3h-1.125zM12.375 10.5h-.75C10.078 10.5 9 9.422 9 7.875 9 6.328 10.078 5.25 11.625 5.25h.75V10.5z" />
    </svg>
  );
}

const OAUTH_ERRORS: Record<string, string> = {
  yandex_denied: "Авторизация через Яндекс отменена",
  yandex_failed: "Ошибка авторизации через Яндекс",
  oauth_failed: "Ошибка OAuth авторизации",
  not_configured: "Яндекс OAuth не настроен на сервере",
};

function CustomerAuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState(oauthError ? (OAUTH_ERRORS[oauthError] ?? "Ошибка OAuth") : "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role: "customer",
          mode,
          name: name || undefined,
          company: company || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка авторизации");
        setLoading(false);
        return;
      }
      setSession({
        user_id: data.user_id,
        tg_id: "",
        name: data.name || name || email.split("@")[0],
        username: email,
        role: "customer",
        logged_in: true,
        login_at: new Date().toISOString(),
      });
      router.push("/c/requests");
    } catch {
      setError("Ошибка сети");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.1),transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          На главную
        </Link>

        <div className="p-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center text-white font-bold">
              C
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {mode === "login" ? "Вход" : "Регистрация"}
              </h1>
              <p className="text-sm text-white/40">Кабинет клиента</p>
            </div>
          </div>

          {/* OAuth providers */}
          <div className="flex flex-col gap-3">
            <a
              href="https://t.me/cargomarketplace_bot?start=login_customer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#2AABEE]/10 border border-[#2AABEE]/20 text-[#2AABEE] font-medium hover:bg-[#2AABEE]/20 transition-all"
            >
              <Send className="h-4 w-4" />
              Войти через Telegram
            </a>

            <a
              href="/api/auth/yandex?role=customer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#FC3F1D]/10 border border-[#FC3F1D]/20 text-[#FC3F1D] font-medium hover:bg-[#FC3F1D]/20 transition-all"
            >
              <YandexIcon />
              Войти через Яндекс
            </a>
          </div>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-white/20">или по email</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "register" && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <input type="text" placeholder="Ваше имя" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 transition-colors" />
                </div>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <input type="text" placeholder="Компания (необязательно)" value={company} onChange={(e) => setCompany(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 transition-colors" />
                </div>
              </>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 transition-colors" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 transition-colors" />
            </div>

            {mode === "login" && (
              <div className="text-right">
                <Link href="/auth/customer/reset-password" className="text-xs text-white/30 hover:text-cyan-400 transition-colors">
                  Забыли пароль?
                </Link>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold hover:shadow-[0_0_30px_rgba(6,182,212,0.25)] transition-all active:scale-[0.98] disabled:opacity-50">
              {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Создать аккаунт"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/30">
            {mode === "login" ? (
              <>Нет аккаунта? <button onClick={() => { setMode("register"); setError(""); }} className="text-cyan-400 hover:text-cyan-300">Зарегистрироваться</button></>
            ) : (
              <>Есть аккаунт? <button onClick={() => { setMode("login"); setError(""); }} className="text-cyan-400 hover:text-cyan-300">Войти</button></>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function CustomerAuthPage() {
  return (
    <Suspense>
      <CustomerAuthForm />
    </Suspense>
  );
}
