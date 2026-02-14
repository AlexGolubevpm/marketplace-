"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Package, ChevronRight, Plus, Clock } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35 } }),
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Черновик", color: "text-white/40", bg: "bg-white/10" },
  matching: { label: "Отправлено", color: "text-blue-400", bg: "bg-blue-500/10" },
  offers_received: { label: "Есть офферы", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  offer_selected: { label: "Выбрано", color: "text-purple-400", bg: "bg-purple-500/10" },
  in_transit: { label: "В доставке", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  completed: { label: "Завершено", color: "text-green-400", bg: "bg-green-500/10" },
  cancelled: { label: "Отменено", color: "text-red-400", bg: "bg-red-500/10" },
};

const mockRequests = [
  { id: "1", origin: "Shenzhen", destination: "Moscow", weight: "1 500 кг", volume: "12.5 м³", status: "offers_received", offers_count: 3, created_at: "14 фев 2026" },
  { id: "2", origin: "Guangzhou", destination: "Almaty", weight: "800 кг", volume: "6.2 м³", status: "matching", offers_count: 0, created_at: "13 фев 2026" },
  { id: "3", origin: "Istanbul", destination: "Moscow", weight: "2 300 кг", volume: "18 м³", status: "offer_selected", offers_count: 5, created_at: "10 фев 2026" },
  { id: "4", origin: "Yiwu", destination: "Bishkek", weight: "450 кг", volume: "3.1 м³", status: "in_transit", offers_count: 4, created_at: "5 фев 2026" },
  { id: "5", origin: "Guangzhou", destination: "Tashkent", weight: "3 200 кг", volume: "25 м³", status: "completed", offers_count: 6, created_at: "20 янв 2026" },
];

export default function CustomerRequestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Мои заявки</h1>
        <Link href="/c/requests/new">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-medium text-sm hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all active:scale-[0.98]">
            <Plus className="h-4 w-4" />
            Новая заявка
          </button>
        </Link>
      </div>

      <motion.div initial="hidden" animate="visible" className="space-y-3">
        {mockRequests.map((req, i) => {
          const st = statusConfig[req.status] || statusConfig.draft;
          return (
            <motion.div key={req.id} variants={fadeUp} custom={i}>
              <Link href={`/c/requests/${req.id}`}>
                <div className="group p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      {/* Route */}
                      <div className="flex items-center gap-2 text-lg font-semibold">
                        <MapPin className="h-4 w-4 text-cyan-400" />
                        {req.origin}
                        <span className="text-white/20">→</span>
                        {req.destination}
                      </div>
                      {/* Details */}
                      <div className="flex items-center gap-4 text-sm text-white/30">
                        <span className="flex items-center gap-1">
                          <Package className="h-3.5 w-3.5" />
                          {req.weight} / {req.volume}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {req.created_at}
                        </span>
                      </div>
                      {/* Status + offers */}
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${st.color} ${st.bg}`}>
                          {st.label}
                        </span>
                        {req.offers_count > 0 && (
                          <span className="text-sm text-white/40">
                            {req.offers_count} предложени{req.offers_count === 1 ? "е" : req.offers_count < 5 ? "я" : "й"}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/10 group-hover:text-white/30 transition-colors mt-1" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
