"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, Building, User, Phone, Truck } from "lucide-react";

export default function CarrierAuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = "/s/requests";
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
              <h1 className="text-xl font-bold">
                {mode === "login" ? "Вход для карго" : "Регистрация карго"}
              </h1>
              <p className="text-sm text-white/40">Получайте заявки и зарабатывайте</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <input
                    type="text"
                    placeholder="Название компании"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 transition-colors"
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <input
                    type="text"
                    placeholder="Контактное лицо"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 transition-colors"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <input
                    type="tel"
                    placeholder="Телефон"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 transition-colors"
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 transition-colors"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold hover:shadow-[0_0_30px_rgba(99,102,241,0.25)] transition-all active:scale-[0.98]"
            >
              {mode === "login" ? "Войти" : "Зарегистрировать компанию"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/30">
            {mode === "login" ? (
              <>Ещё не подключены?{" "}
                <button onClick={() => setMode("register")} className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  Подать заявку
                </button>
              </>
            ) : (
              <>Уже есть аккаунт?{" "}
                <button onClick={() => setMode("login")} className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  Войти
                </button>
              </>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
