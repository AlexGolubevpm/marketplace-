"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, MapPin, Package, Plane, Send } from "lucide-react";
import Link from "next/link";

export default function NewRequestPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/c/requests");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link href="/c/requests" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Назад
      </Link>

      <h1 className="text-2xl font-bold">Новая заявка</h1>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step >= s ? "bg-cyan-500 text-white" : "bg-white/[0.06] text-white/20"
            }`}>
              {s}
            </div>
            <span className={`text-sm hidden sm:block ${step >= s ? "text-white/60" : "text-white/20"}`}>
              {s === 1 ? "Маршрут" : s === 2 ? "Груз" : "Отправка"}
            </span>
            {s < 3 && <div className={`flex-1 h-px ${step > s ? "bg-cyan-500/50" : "bg-white/[0.06]"}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-cyan-400" /> Маршрут</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/30 block mb-1">Страна отправления</label>
                  <select className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-cyan-500/40">
                    <option value="CN">Китай</option>
                    <option value="TR">Турция</option>
                    <option value="DE">Германия</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-white/30 block mb-1">Город отправления</label>
                  <input placeholder="Например, Гуанчжоу" className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40" />
                </div>
                <div>
                  <label className="text-sm text-white/30 block mb-1">Страна назначения</label>
                  <select className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-cyan-500/40">
                    <option value="RU">Россия</option>
                    <option value="KZ">Казахстан</option>
                    <option value="UZ">Узбекистан</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-white/30 block mb-1">Город назначения</label>
                  <input placeholder="Например, Москва" className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40" />
                </div>
              </div>
            </div>
            <button type="button" onClick={() => setStep(2)} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all active:scale-[0.98]">
              Далее <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><Package className="h-4 w-4 text-cyan-400" /> Груз</h2>
              <div>
                <label className="text-sm text-white/30 block mb-1">Описание груза</label>
                <textarea rows={3} placeholder="Что везёте? Опишите товар..." className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/30 block mb-1">Вес (кг)</label>
                  <input type="number" placeholder="1500" className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40" />
                </div>
                <div>
                  <label className="text-sm text-white/30 block mb-1">Объём (м³)</label>
                  <input type="number" placeholder="12.5" className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40" />
                </div>
              </div>
              <div>
                <label className="text-sm text-white/30 block mb-1">Тип доставки</label>
                <select className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-cyan-500/40">
                  <option value="any">Любой</option>
                  <option value="air">Авиа</option>
                  <option value="sea">Море</option>
                  <option value="rail">ЖД</option>
                  <option value="road">Авто</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 font-medium hover:bg-white/5 transition-colors">
                Назад
              </button>
              <button type="button" onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all active:scale-[0.98]">
                Далее <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><Send className="h-4 w-4 text-cyan-400" /> Подтверждение</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-white/30">Маршрут</span>
                  <span className="font-medium">CN, Гуанчжоу → RU, Москва</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-white/30">Груз</span>
                  <span className="font-medium">Электроника</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-white/30">Вес / Объём</span>
                  <span className="font-medium">1 500 кг / 12.5 м³</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-white/30">Тип доставки</span>
                  <span className="font-medium">Любой</span>
                </div>
              </div>
              <p className="text-xs text-white/20">Заявка будет отправлена подходящим карго-компаниям. Вы получите офферы в течение нескольких часов.</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 font-medium hover:bg-white/5 transition-colors">
                Назад
              </button>
              <button type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all active:scale-[0.98]">
                Отправить заявку
              </button>
            </div>
          </motion.div>
        )}
      </form>
    </div>
  );
}
