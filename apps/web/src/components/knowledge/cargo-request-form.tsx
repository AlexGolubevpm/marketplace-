"use client";

import { useState } from "react";
import { Send, CheckCircle, Truck, Package, MapPin, User, Phone, Mail, MessageSquare, ArrowRight, ArrowLeft } from "lucide-react";

const TOTAL_STEPS = 3;

export function CargoRequestForm({ variant = "full" }: { variant?: "full" | "compact" }) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    originCity: "",
    destinationCity: "",
    cargo: "",
    weight: "",
    comment: "",
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!form.name.trim()) return "Введите ваше имя";
      if (!form.phone.trim() && !form.email.trim()) return "Введите телефон или email";
    }
    if (s === 2) {
      if (!form.cargo.trim()) return "Опишите ваш груз";
    }
    return null;
  };

  const nextStep = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const prevStep = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/cargo-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Ошибка отправки");
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-8 text-center">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Заявка отправлена!</h3>
        <p className="text-gray-600 mb-4">
          Наш менеджер свяжется с вами в ближайшее время для расчёта стоимости доставки.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setStep(1);
            setForm({ name: "", phone: "", email: "", originCity: "", destinationCity: "", cargo: "", weight: "", comment: "" });
          }}
          className="text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Отправить ещё одну заявку
        </button>
      </div>
    );
  }

  const inputClass =
    "w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-white/[0.08] transition-all";

  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 md:p-8 shadow-2xl" id="cargo-form">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-3">
          <Truck className="h-4 w-4 text-red-400" />
          <span className="text-xs font-medium text-red-400 uppercase tracking-wider">Бесплатный расчёт</span>
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
          Рассчитайте доставку из Китая
        </h3>
        <p className="text-gray-400 text-sm max-w-lg mx-auto">
          Заполните форму — мы подберём лучший маршрут и рассчитаем стоимость
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6 max-w-xs mx-auto">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div
              className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                i + 1 <= step ? "bg-red-500" : "bg-white/10"
              }`}
            />
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        {/* Step 1: Contact */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Шаг 1 — Контактные данные</p>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Ваше имя *"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className={inputClass}
                autoFocus
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="tel"
                placeholder="Телефон *"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="email"
                placeholder="Email (необязательно)"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* Step 2: Route & Cargo */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Шаг 2 — Маршрут и груз</p>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Откуда (город, Китай)"
                value={form.originCity}
                onChange={(e) => update("originCity", e.target.value)}
                className={inputClass}
                autoFocus
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Куда (город, Россия)"
                value={form.destinationCity}
                onChange={(e) => update("destinationCity", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="relative">
              <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Что везём? (электроника, одежда...) *"
                value={form.cargo}
                onChange={(e) => update("cargo", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">кг</span>
              <input
                type="text"
                placeholder="Вес (необязательно)"
                value={form.weight}
                onChange={(e) => update("weight", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* Step 3: Comment + Submit */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Шаг 3 — Дополнительно</p>
            {variant === "full" && (
              <div className="relative">
                <MessageSquare className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
                <textarea
                  placeholder="Дополнительная информация (необязательно)"
                  rows={3}
                  value={form.comment}
                  onChange={(e) => update("comment", e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500/50 focus:bg-white/[0.08] transition-all resize-none"
                  autoFocus
                />
              </div>
            )}
            {/* Summary */}
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 space-y-1.5 text-sm">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Ваша заявка</p>
              <div className="flex justify-between">
                <span className="text-gray-500">Имя</span>
                <span className="text-white font-medium">{form.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Контакт</span>
                <span className="text-white font-medium">{form.phone || form.email}</span>
              </div>
              {form.originCity && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Маршрут</span>
                  <span className="text-white font-medium">{form.originCity} → {form.destinationCity || "?"}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Груз</span>
                <span className="text-white font-medium">{form.cargo}{form.weight ? `, ${form.weight} кг` : ""}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-5 flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="flex items-center justify-center gap-1.5 px-5 py-3.5 rounded-xl border border-white/[0.1] text-gray-400 hover:text-white hover:border-white/20 transition-all text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold hover:from-red-700 hover:to-red-600 transition-all active:scale-[0.98] shadow-lg shadow-red-500/20"
            >
              Далее
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold hover:from-red-700 hover:to-red-600 transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-red-500/20"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Отправляем...
                </span>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Отправить заявку
                </>
              )}
            </button>
          )}
        </div>

        <p className="mt-3 text-center text-xs text-gray-500">
          Нажимая кнопку, вы соглашаетесь с обработкой персональных данных.
        </p>
      </form>

      {/* Trust signals */}
      <div className="mt-6 grid grid-cols-3 gap-4 max-w-sm mx-auto">
        <div className="text-center">
          <p className="text-xl font-bold text-white">500+</p>
          <p className="text-xs text-gray-500">Доставок</p>
        </div>
        <div className="text-center border-x border-white/10">
          <p className="text-xl font-bold text-white">50+</p>
          <p className="text-xs text-gray-500">Карго-компаний</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-white">1 час</p>
          <p className="text-xs text-gray-500">Время ответа</p>
        </div>
      </div>
    </div>
  );
}
