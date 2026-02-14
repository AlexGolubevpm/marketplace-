"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Package, DollarSign, Clock, Send, CheckCircle2 } from "lucide-react";

export default function CarrierRequestDetailPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [price, setPrice] = useState("");
  const [daysMin, setDaysMin] = useState("");
  const [daysMax, setDaysMax] = useState("");
  const [deliveryType, setDeliveryType] = useState("sea");
  const [comment, setComment] = useState("");
  const [includes, setIncludes] = useState({
    pickup: false,
    customs: false,
    doorDelivery: false,
    insurance: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Link href="/s/requests" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Назад к заявкам
      </Link>

      {/* Request info */}
      <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2 text-xl font-bold mb-4">
          <MapPin className="h-5 w-5 text-indigo-400" />
          Shenzhen <span className="text-white/20">→</span> Moscow
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><span className="text-white/30">Вес:</span> <span className="font-medium">1 500 кг</span></div>
          <div><span className="text-white/30">Объём:</span> <span className="font-medium">12.5 м³</span></div>
          <div><span className="text-white/30">Категория:</span> <span className="font-medium">Электроника</span></div>
          <div><span className="text-white/30">Особенности:</span> <span className="font-medium">Хрупкий груз</span></div>
          <div><span className="text-white/30">Дедлайн:</span> <span className="font-medium text-orange-400">15 фев, 10:30</span></div>
        </div>
      </div>

      {submitted ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-8 rounded-2xl border border-green-500/20 bg-green-500/[0.03] text-center">
          <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Оффер отправлен</h2>
          <p className="text-sm text-white/40 mb-6">Клиент получит ваше предложение и сможет его выбрать.</p>
          <button onClick={() => router.push("/s/requests")} className="px-6 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors">
            Вернуться к заявкам
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-5">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-indigo-400" />
              Ваше предложение
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/30 block mb-1">Цена (USD)</label>
                <input type="number" required placeholder="6200" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-lg font-semibold placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 transition-colors" />
              </div>
              <div>
                <label className="text-sm text-white/30 block mb-1">Валюта</label>
                <select className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-indigo-500/40">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="CNY">CNY</option>
                  <option value="RUB">RUB</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/30 block mb-1">Срок от (дней)</label>
                <input type="number" required placeholder="16" value={daysMin} onChange={(e) => setDaysMin(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 transition-colors" />
              </div>
              <div>
                <label className="text-sm text-white/30 block mb-1">Срок до (дней)</label>
                <input type="number" placeholder="20" value={daysMax} onChange={(e) => setDaysMax(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 transition-colors" />
              </div>
            </div>

            <div>
              <label className="text-sm text-white/30 block mb-1">Тип доставки</label>
              <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-indigo-500/40">
                <option value="air">Авиа</option>
                <option value="sea">Море</option>
                <option value="rail">ЖД</option>
                <option value="road">Авто</option>
                <option value="multimodal">Мультимодальный</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-white/30 block mb-3">Включено в стоимость</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "pickup", label: "Забор груза" },
                  { key: "customs", label: "Таможенное оформление" },
                  { key: "doorDelivery", label: "Доставка до двери" },
                  { key: "insurance", label: "Страховка" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition-colors">
                    <input
                      type="checkbox"
                      checked={(includes as any)[key]}
                      onChange={(e) => setIncludes({ ...includes, [key]: e.target.checked })}
                      className="accent-indigo-500"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-white/30 block mb-1">Комментарий</label>
              <textarea rows={3} placeholder="Дополнительные условия, требования к грузу..." value={comment} onChange={(e) => setComment(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 transition-colors resize-none" />
            </div>
          </div>

          <button type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-lg flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(99,102,241,0.25)] transition-all active:scale-[0.98]">
            <Send className="h-5 w-5" />
            Отправить оффер
          </button>
        </form>
      )}
    </div>
  );
}
