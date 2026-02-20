"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, CheckCircle } from "lucide-react";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params.get("token") ?? "";
  const emailParam = params.get("email") ?? "";

  // If no token → request reset step; if token present → set new password step
  const [step, setStep] = useState<"request" | "set">(token ? "set" : "request");

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: "customer" }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Ошибка");
      } else {
        setDone(true);
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const handleSet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }
    if (password.length < 8) {
      setError("Пароль должен быть не менее 8 символов");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password, role: "customer" }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "Ошибка");
      } else {
        setDone(true);
        setTimeout(() => router.push("/auth/customer"), 2500);
      }
    } catch {
      setError("Ошибка сети");
    } finally {
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
        <Link href="/auth/customer" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Назад к входу
        </Link>

        <div className="p-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm">
          <h1 className="text-xl font-bold mb-2">
            {step === "request" ? "Сброс пароля" : "Новый пароль"}
          </h1>
          <p className="text-sm text-white/40 mb-8">
            {step === "request"
              ? "Введите email — пришлём ссылку для сброса"
              : "Придумайте новый пароль для вашего аккаунта"}
          </p>

          {done ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle className="h-12 w-12 text-cyan-400" />
              <p className="text-center text-white/70">
                {step === "request"
                  ? "Если аккаунт существует, ссылка для сброса отправлена на ваш email."
                  : "Пароль успешно изменён. Перенаправляем..."}
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {step === "request" ? (
                <form onSubmit={handleRequest} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <input
                      type="email"
                      placeholder="Ваш email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold hover:shadow-[0_0_30px_rgba(6,182,212,0.25)] transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? "Отправка..." : "Отправить ссылку"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSet} className="space-y-3">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <input
                      type="password"
                      placeholder="Новый пароль"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 transition-colors"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <input
                      type="password"
                      placeholder="Повторите пароль"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      minLength={8}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold hover:shadow-[0_0_30px_rgba(6,182,212,0.25)] transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? "Сохранение..." : "Установить пароль"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
