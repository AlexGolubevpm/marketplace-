"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Package, Clock, Star, CheckCircle2, Truck, Shield, FileText, Anchor, Plane, Train } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35 } }),
};

const deliveryIcons: Record<string, any> = { air: Plane, sea: Anchor, rail: Train, road: Truck };

const mockOffers = [
  { id: "o1", carrier: "SilkWay Express", rating: 4.8, response_time: "45 мин", price: 8500, currency: "USD", days: "7–9", delivery_type: "air", tags: ["Забор", "Таможня", "До двери", "Страховка"] },
  { id: "o2", carrier: "FastCargo", rating: 4.5, response_time: "1ч 15м", price: 6200, currency: "USD", days: "16–20", delivery_type: "sea", tags: ["Забор", "Таможня"] },
  { id: "o3", carrier: "RailBridge", rating: 4.2, response_time: "2ч", price: 5800, currency: "USD", days: "20–25", delivery_type: "rail", tags: ["Забор", "Таможня", "До двери"] },
];

const timeline = [
  { status: "Оффер выбран", date: "14 фев", active: true },
  { status: "Груз передан", date: "", active: false },
  { status: "В пути", date: "", active: false },
  { status: "Таможня", date: "", active: false },
  { status: "Доставлено", date: "", active: false },
];

export default function CustomerRequestDetailPage() {
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

  const handleSelect = (offerId: string) => {
    setSelectedOffer(offerId);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setConfirmed(true);
    setShowConfirm(false);
  };

  return (
    <div className="space-y-8">
      <Link href="/c/requests" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Назад к заявкам
      </Link>

      {/* Request info */}
      <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2 text-2xl font-bold mb-4">
          <MapPin className="h-5 w-5 text-cyan-400" />
          Shenzhen <span className="text-white/20">→</span> Moscow
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-white/30">Вес:</span> <span className="font-medium">1 500 кг</span></div>
          <div><span className="text-white/30">Объём:</span> <span className="font-medium">12.5 м³</span></div>
          <div><span className="text-white/30">Категория:</span> <span className="font-medium">Электроника</span></div>
          <div><span className="text-white/30">Создана:</span> <span className="font-medium">14 фев 2026</span></div>
        </div>
      </div>

      {/* Offers or Timeline */}
      {!confirmed ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Предложения ({mockOffers.length})</h2>
            {mockOffers.length >= 2 && (
              <button
                onClick={() => setCompareMode(!compareMode)}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {compareMode ? "Карточки" : "Сравнить"}
              </button>
            )}
          </div>

          {compareMode ? (
            /* Comparison table */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-3 px-4 text-white/30 font-medium">Карго</th>
                    <th className="text-left py-3 px-4 text-white/30 font-medium">Цена</th>
                    <th className="text-left py-3 px-4 text-white/30 font-medium">Срок</th>
                    <th className="text-left py-3 px-4 text-white/30 font-medium">Включено</th>
                    <th className="text-right py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {mockOffers.map((o) => (
                    <tr key={o.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="py-4 px-4">
                        <div className="font-medium">{o.carrier}</div>
                        <div className="flex items-center gap-1 text-xs text-white/30 mt-0.5">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />{o.rating}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-lg font-bold">${o.price.toLocaleString()}</td>
                      <td className="py-4 px-4">{o.days} дней</td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {o.tags.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded-full bg-white/[0.06] text-xs text-white/40">{t}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button onClick={() => handleSelect(o.id)} className="px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 transition-colors">
                          Выбрать
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Offer cards */
            <motion.div initial="hidden" animate="visible" className="space-y-4">
              {mockOffers.map((offer, i) => {
                const DIcon = deliveryIcons[offer.delivery_type] || Truck;
                return (
                  <motion.div
                    key={offer.id}
                    variants={fadeUp}
                    custom={i}
                    className="group p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold">{offer.carrier}</span>
                          <span className="flex items-center gap-1 text-sm text-white/30">
                            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />{offer.rating}
                          </span>
                          <span className="text-xs text-white/20">ответ за {offer.response_time}</span>
                        </div>
                        <div className="flex items-center gap-6">
                          <div>
                            <div className="text-3xl font-bold">${offer.price.toLocaleString()}</div>
                            <div className="text-xs text-white/20 mt-0.5">{offer.currency}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold">{offer.days}</div>
                            <div className="text-xs text-white/20">дней</div>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-white/30">
                            <DIcon className="h-4 w-4" />
                            {offer.delivery_type}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {offer.tags.map((tag) => (
                            <span key={tag} className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-white/40">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelect(offer.id)}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-medium hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all active:scale-[0.98] whitespace-nowrap"
                      >
                        Выбрать
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </>
      ) : (
        /* Post-selection: timeline + selected carrier */
        <>
          <div className="p-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.03]">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="h-6 w-6 text-cyan-400" />
              <h2 className="text-xl font-bold">Оффер выбран</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">SilkWay Express</p>
                <p className="text-sm text-white/40">$8,500 • 7–9 дней • Авиа</p>
              </div>
              <a href="https://t.me/" target="_blank" className="px-4 py-2 rounded-lg bg-[#2AABEE]/10 border border-[#2AABEE]/20 text-[#2AABEE] text-sm font-medium hover:bg-[#2AABEE]/20 transition-colors">
                Связаться в TG
              </a>
            </div>
          </div>

          <h2 className="text-xl font-bold">Статус доставки</h2>
          <div className="pl-4 space-y-0">
            {timeline.map((step, i) => (
              <div key={step.status} className="flex items-start gap-4 pb-6 relative">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${step.active ? "bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "bg-white/10"}`} />
                  {i < timeline.length - 1 && <div className="w-0.5 flex-1 bg-white/[0.06] mt-1" />}
                </div>
                <div className={step.active ? "text-white" : "text-white/20"}>
                  <p className="font-medium text-sm">{step.status}</p>
                  {step.date && <p className="text-xs mt-0.5">{step.date}</p>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md p-8 rounded-2xl border border-white/[0.08] bg-[#12121a]"
          >
            <h3 className="text-xl font-bold mb-2">Подтвердить выбор?</h3>
            <p className="text-sm text-white/40 mb-6">
              Вы выбираете оффер от <strong className="text-white">SilkWay Express</strong> за <strong className="text-white">$8,500</strong>.
              После подтверждения другие офферы будут скрыты.
            </p>
            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <input type="checkbox" className="mt-1 accent-cyan-500" />
              <span className="text-sm text-white/50">Я подтверждаю условия доставки и согласен с правилами платформы</span>
            </label>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 font-medium hover:bg-white/5 transition-colors">
                Отмена
              </button>
              <button onClick={handleConfirm} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all active:scale-[0.98]">
                Подтвердить выбор
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
