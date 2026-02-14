"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, MapPin, Package, Send } from "lucide-react";
import Link from "next/link";
import { createRequest } from "@/lib/store";
import { getSession } from "@/lib/auth";

const countries = [
  { code: "CN", name: "Китай", flag: "🇨🇳" },
  { code: "TR", name: "Турция", flag: "🇹🇷" },
  { code: "DE", name: "Германия", flag: "🇩🇪" },
  { code: "IT", name: "Италия", flag: "🇮🇹" },
  { code: "KR", name: "Южная Корея", flag: "🇰🇷" },
];

const destCountries = [
  { code: "RU", name: "Россия", flag: "🇷🇺" },
  { code: "KZ", name: "Казахстан", flag: "🇰🇿" },
  { code: "UZ", name: "Узбекистан", flag: "🇺🇿" },
  { code: "KG", name: "Кыргызстан", flag: "🇰🇬" },
  { code: "BY", name: "Беларусь", flag: "🇧🇾" },
];

const inputClass = "w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 transition-colors";
const selectClass = inputClass;

export default function NewRequestPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    origin_country: "CN",
    origin_city: "",
    destination_country: "RU",
    destination_city: "",
    cargo_description: "",
    weight_kg: "",
    volume_m3: "",
    delivery_type: "any",
  });

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const countryName = (code: string) => [...countries, ...destCountries].find((c) => c.code === code)?.name || code;

  const handleSubmit = () => {
    const session = getSession();
    const userId = session?.tg_id || session?.username || "anonymous";

    createRequest({
      customer_id: userId,
      origin_country: form.origin_country,
      origin_city: form.origin_city,
      destination_country: form.destination_country,
      destination_city: form.destination_city,
      cargo_description: form.cargo_description,
      weight_kg: form.weight_kg,
      volume_m3: form.volume_m3,
      delivery_type_preferred: form.delivery_type,
    });

    router.push("/c/requests");
  };

  const canProceed1 = form.origin_city.trim() !== "" && form.destination_city.trim() !== "";
  const canProceed2 = form.cargo_description.trim() !== "";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/c/requests" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Назад
      </Link>

      <h1 className="text-2xl font-bold">Новая заявка</h1>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {[
          { n: 1, label: "Маршрут" },
          { n: 2, label: "Груз" },
          { n: 3, label: "Отправка" },
        ].map((s) => (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${step >= s.n ? "bg-cyan-500 text-white" : "bg-white/[0.06] text-white/20"}`}>{s.n}</div>
            <span className={`text-sm hidden sm:block ${step >= s.n ? "text-white/60" : "text-white/20"}`}>{s.label}</span>
            {s.n < 3 && <div className={`flex-1 h-px ${step > s.n ? "bg-cyan-500/50" : "bg-white/[0.06]"}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-cyan-400" /> Маршрут</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/30 block mb-1">Откуда (страна)</label>
                  <select value={form.origin_country} onChange={(e) => update("origin_country", e.target.value)} className={selectClass}>
                    {countries.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-white/30 block mb-1">Город отправления *</label>
                  <input value={form.origin_city} onChange={(e) => update("origin_city", e.target.value)} placeholder="Гуанчжоу" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm text-white/30 block mb-1">Куда (страна)</label>
                  <select value={form.destination_country} onChange={(e) => update("destination_country", e.target.value)} className={selectClass}>
                    {destCountries.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-white/30 block mb-1">Город назначения *</label>
                  <input value={form.destination_city} onChange={(e) => update("destination_city", e.target.value)} placeholder="Москва" className={inputClass} />
                </div>
              </div>
            </div>
            <button disabled={!canProceed1} onClick={() => setStep(2)} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all active:scale-[0.98]">
              Далее <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><Package className="h-4 w-4 text-cyan-400" /> Груз</h2>
              <div>
                <label className="text-sm text-white/30 block mb-1">Описание груза *</label>
                <textarea rows={3} value={form.cargo_description} onChange={(e) => update("cargo_description", e.target.value)} placeholder="Что везёте? Например: электроника, одежда, запчасти..." className={`${inputClass} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/30 block mb-1">Вес (кг)</label>
                  <input type="number" value={form.weight_kg} onChange={(e) => update("weight_kg", e.target.value)} placeholder="1500" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm text-white/30 block mb-1">Объём (м³)</label>
                  <input type="number" value={form.volume_m3} onChange={(e) => update("volume_m3", e.target.value)} placeholder="12.5" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="text-sm text-white/30 block mb-1">Предпочтение по доставке</label>
                <select value={form.delivery_type} onChange={(e) => update("delivery_type", e.target.value)} className={selectClass}>
                  <option value="any">Любой способ</option>
                  <option value="air">Авиа (быстро)</option>
                  <option value="sea">Море (дёшево)</option>
                  <option value="rail">ЖД</option>
                  <option value="road">Авто</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 font-medium hover:bg-white/5 transition-colors">Назад</button>
              <button disabled={!canProceed2} onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all active:scale-[0.98]">
                Далее <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-3">
              <h2 className="font-semibold flex items-center gap-2"><Send className="h-4 w-4 text-cyan-400" /> Подтверждение</h2>
              <div className="space-y-2 text-sm">
                {[
                  ["Маршрут", `${countryName(form.origin_country)}, ${form.origin_city} → ${countryName(form.destination_country)}, ${form.destination_city}`],
                  ["Груз", form.cargo_description],
                  ["Вес", form.weight_kg ? `${form.weight_kg} кг` : "Не указан"],
                  ["Объём", form.volume_m3 ? `${form.volume_m3} м³` : "Не указан"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-white/[0.04]">
                    <span className="text-white/30">{label}</span>
                    <span className="font-medium text-right max-w-[60%]">{value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/20 pt-2">
                Заявка будет отправлена подходящим карго-компаниям. Обычно первые предложения приходят в течение 1-2 часов.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 font-medium hover:bg-white/5 transition-colors">Назад</button>
              <button onClick={handleSubmit} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all active:scale-[0.98]">
                Отправить заявку
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
