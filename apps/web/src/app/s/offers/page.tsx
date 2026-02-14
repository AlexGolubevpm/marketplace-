"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, DollarSign, Clock, CheckCircle2, XCircle, Clock3, Inbox } from "lucide-react";
import { getOffersByCarrier, getRequestById, type Offer } from "@/lib/store";
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
  const [offers, setOffers] = useState<(Offer & { route?: string })[]>([]);

  useEffect(() => {
    const session = getSession();
    const carrierId = session?.tg_id || session?.username || "carrier";
    const myOffers = getOffersByCarrier(carrierId);

    // Enrich with route info
    const enriched = myOffers.map((o) => {
      const req = getRequestById(o.request_id);
      return {
        ...o,
        route: req ? `${req.origin_city} → ${req.destination_city}` : "—",
      };
    });
    setOffers(enriched);

    const interval = setInterval(() => {
      const fresh = getOffersByCarrier(carrierId).map((o) => {
        const req = getRequestById(o.request_id);
        return { ...o, route: req ? `${req.origin_city} → ${req.destination_city}` : "—" };
      });
      setOffers(fresh);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (offers.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Мои офферы</h1>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="h-8 w-8 text-white/10 mb-3" />
          <p className="text-white/30">Вы ещё не отправляли офферов</p>
          <p className="text-white/15 text-sm mt-1">Откройте новые заявки и отправьте предложение</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Мои офферы</h1>
      <motion.div initial="hidden" animate="visible" className="space-y-3">
        {offers.map((offer, i) => {
          const st = statusMap[offer.status] || statusMap.active;
          const Icon = st.icon;
          return (
            <motion.div key={offer.id} variants={fadeUp} custom={i}>
              <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <MapPin className="h-4 w-4 text-indigo-400" />
                      {offer.route}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/30">
                      <span className="text-white font-semibold">${offer.price.toLocaleString()}</span>
                      <span>{offer.estimated_days_min}-{offer.estimated_days_max} дней</span>
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
    </div>
  );
}
