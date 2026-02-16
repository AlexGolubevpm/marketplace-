"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, Building, User, Phone, Truck } from "lucide-react";
import { setSession } from "@/lib/auth";

export default function CarrierAuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
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
          role: "carrier",
          mode,
          name: contactName || undefined,
          company: companyName || undefined,
          phone: phone || undefined,
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
        name: data.name || contactName || companyName || email.split("@")[0],
        username: email,
        role: "carrier",
        logged_in: true,
        login_at: new Date().toISOString(),
      });
      router.push("/s/requests");
    } catch {
      setError("Ошибка сети");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.1),transparent_50%)]" />

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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{mode === "login" ? "Вход" : "Регистрация"}</h1>
              <p className="text-sm text-white/40">Кабинет карго</p>
            </div>
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
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <input type="text" placeholder="Название компании" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 transition-colors" />
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <input type="text" placeholder="Контактное лицо" value={contactName} onChange={(e) => setContactName(e.target.value)} required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 transition-colors" />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <input type="tel" placeholder="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)} required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 transition-colors" />
                </div>
              </>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 transition-colors" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 transition-colors" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold hover:shadow-[0_0_30px_rgba(99,102,241,0.25)] transition-all active:scale-[0.98] disabled:opacity-50">
              {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Зарегистрировать компанию"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/30">
            {mode === "login" ? (
              <>Нет аккаунта? <button onClick={() => { setMode("register"); setError(""); }} className="text-indigo-400 hover:text-indigo-300">Подать заявку</button></>
            ) : (
              <>Есть аккаунт? <button onClick={() => { setMode("login"); setError(""); }} className="text-indigo-400 hover:text-indigo-300">Войти</button></>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
