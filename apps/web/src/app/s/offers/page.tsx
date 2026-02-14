"use client";

import { motion } from "framer-motion";
import { MapPin, DollarSign, Clock, CheckCircle2, XCircle, Clock3 } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35 } }),
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  active: { label: "Ожидает", color: "text-blue-400", bg: "bg-blue-500/10", icon: Clock3 },
  selected: { label: "Выбран", color: "text-green-400", bg: "bg-green-500/10", icon: CheckCircle2 },
  rejected: { label: "Не выбран", color: "text-white/30", bg: "bg-white/[0.04]", icon: XCircle },
};

const mockOffers = [
  { id: "1", route: "Shenzhen → Moscow", price: 6200, days: "16–20", delivery: "Море", status: "active", created: "14 фев" },
  { id: "2", route: "Istanbul → Moscow", price: 3800, days: "10–14", delivery: "Авто", status: "selected", created: "12 фев" },
  { id: "3", route: "Guangzhou → Almaty", price: 4100, days: "18–22", delivery: "ЖД", status: "active", created: "11 фев" },
  { id: "4", route: "Yiwu → Bishkek", price: 2900, days: "20–25", delivery: "Море", status: "rejected", created: "8 фев" },
  { id: "5", route: "Shenzhen → Ekaterinburg", price: 5500, days: "7–9", delivery: "Авиа", status: "selected", created: "5 фев" },
];

export default function CarrierOffersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Мои офферы</h1>

      <motion.div initial="hidden" animate="visible" className="space-y-3">
        {mockOffers.map((offer, i) => {
          const st = statusConfig[offer.status];
          const Icon = st.icon;
          return (
            <motion.div key={offer.id} variants={fadeUp} custom={i}>
              <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <MapPin className="h-4 w-4 text-indigo-400" />
                      {offer.route}
                    </div>
                    <div className="flex items-center gap-5 text-sm text-white/30">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span className="text-white font-semibold">${offer.price.toLocaleString()}</span>
                      </span>
                      <span>{offer.days} дней</span>
                      <span>{offer.delivery}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{offer.created}</span>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${st.color} ${st.bg}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {st.label}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
