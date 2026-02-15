"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { MapPin, DollarSign, Clock, CheckCircle2, XCircle, Clock3, Inbox } from "lucide-react";
import { getOffersByCarrier, type Offer } from "@/lib/store";
import { getSession } from "@/lib/auth";

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35 } }),
};

const statusMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  active: { label: "Ожидает", color: "text-blue-400", bg: "bg-blue-500/10", icon: Clock3 },
  selected: { label: "Выбран!", color: "text-green-400", bg: "bg-green-500/10", icon: CheckCircle2 },
  rejected: { label: "Не выбран", color: "text-white/30", bg: "bg-white/[0.04]", icon: XCircle },
  expired: { label: "Истёк", color: "text-orange-400", bg: "bg-orange-500/10", icon: Clock },
};

const deliveryLabels: Record<string, string> = { air: "Авиа", sea: "Море", rail: "ЖД", road: "Авто" };

export default function CarrierOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const session = getSession();
      const carrierId = session?.tg_id || session?.username || "carrier";
      const data = await getOffersByCarrier(carrierId);
      setOffers(data);
    } catch (e) {
      console.error("Failed to load offers:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) return <div className="space-y-3">{[1,2].map((i) => <div key={i} className="h-20 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Мои офферы</h1>
      {offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="h-8 w-8 text-white/10 mb-3" />
          <p className="text-white/30">Вы ещё не отправляли офферов</p>
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" className="space-y-3">
          {offers.map((offer, i) => {
            const st = statusMap[offer.status] || statusMap.active;
            const Icon = st.icon;
            const price = typeof offer.price === "string" ? parseFloat(offer.price) : offer.price;
            return (
              <motion.div key={offer.id} variants={fadeUp} custom={i}>
                <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-4 text-sm text-white/30">
                        <span className="text-white font-semibold">${price.toLocaleString()}</span>
                        <span>{offer.estimated_days || "—"} дней</span>
                        <span>{deliveryLabels[offer.delivery_type] || offer.delivery_type}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(offer.created_at).toLocaleDateString("ru-RU")}</span>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${st.color} ${st.bg}`}>
                      <Icon className="h-3.5 w-3.5" />{st.label}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
