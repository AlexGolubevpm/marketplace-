"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DollarSign, Clock, CheckCircle2, XCircle, Clock3, Inbox, ChevronRight, MapPin } from "lucide-react";
import { getOffersByCarrier, type Offer } from "@/lib/store";
import { getSession } from "@/lib/auth";

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35 } }),
};

const statusMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  active: { label: "Ожидает", color: "text-blue-600", bg: "bg-blue-50", icon: Clock3 },
  selected: { label: "Выбран!", color: "text-green-600", bg: "bg-green-50", icon: CheckCircle2 },
  rejected: { label: "Не выбран", color: "text-gray-500", bg: "bg-gray-100", icon: XCircle },
  expired: { label: "Истёк", color: "text-orange-600", bg: "bg-orange-50", icon: Clock },
};

const deliveryLabels: Record<string, string> = { air: "Авиа", sea: "Море", rail: "ЖД", road: "Авто" };

const ORDER_STATUS_LABELS: Record<string, string> = {
  payment_pending: "Ожидает оплаты",
  confirmed: "Подтверждён",
  awaiting_shipment: "Ожидает отгрузки",
  in_transit: "В пути",
  customs: "Таможня",
  customs_hold: "Задержка на таможне",
  delivered: "Доставлен",
  completed: "Завершён",
  cancelled: "Отменён",
};

interface RequestInfo {
  origin_city: string;
  origin_country: string;
  destination_city: string;
  destination_country: string;
  display_id: string;
  order?: { id: string; display_id: string; status: string; tracking_number?: string };
}

export default function CarrierOffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestMap, setRequestMap] = useState<Record<string, RequestInfo>>({});

  const load = useCallback(async () => {
    try {
      const session = getSession("carrier");
      const carrierId = session?.user_id || session?.tg_id || session?.username || "carrier";
      const data = await getOffersByCarrier(carrierId);
      setOffers(data);

      // Fetch request info for each offer
      const uniqueRequestIds = [...new Set(data.map((o) => o.request_id))];
      const newRequestMap: Record<string, RequestInfo> = {};

      await Promise.all(
        uniqueRequestIds.map(async (requestId) => {
          try {
            const res = await fetch(`/api/requests/${requestId}`);
            if (res.ok) {
              const req = await res.json();
              newRequestMap[requestId] = {
                origin_city: req.origin_city,
                origin_country: req.origin_country,
                destination_city: req.destination_city,
                destination_country: req.destination_country,
                display_id: req.display_id,
                order: req.order || undefined,
              };
            }
          } catch {}
        })
      );

      setRequestMap(newRequestMap);
    } catch (e) {
      console.error("Failed to load offers:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) return <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-24 rounded-2xl bg-white border border-gray-200 animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Мои офферы</h1>
      {offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="h-8 w-8 text-gray-300 mb-3" />
          <p className="text-gray-500">Вы ещё не отправляли офферов</p>
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" className="space-y-3">
          {offers.map((offer, i) => {
            const st = statusMap[offer.status] || statusMap.active;
            const Icon = st.icon;
            const price = typeof offer.price === "string" ? parseFloat(offer.price) : offer.price;
            const reqInfo = requestMap[offer.request_id];
            const order = reqInfo?.order;

            return (
              <motion.div key={offer.id} variants={fadeUp} custom={i}>
                <button
                  onClick={() => router.push(`/s/offers/${offer.id}`)}
                  className="w-full text-left rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Route */}
                      {reqInfo && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <MapPin className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                          <span className="font-medium truncate">
                            {reqInfo.origin_city} &rarr; {reqInfo.destination_city}
                          </span>
                          <span className="text-gray-400 text-xs ml-1">{reqInfo.display_id}</span>
                        </div>
                      )}
                      {/* Offer details */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="text-gray-900 font-semibold">${price.toLocaleString()}</span>
                        <span>{offer.estimated_days || "—"} дней</span>
                        <span>{deliveryLabels[offer.delivery_type] || offer.delivery_type}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(offer.created_at).toLocaleDateString("ru-RU")}</span>
                      </div>
                      {/* Order status */}
                      {order && (
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>Заказ: {order.display_id}</span>
                          <span className="px-2 py-0.5 rounded bg-gray-50 border border-gray-100">{ORDER_STATUS_LABELS[order.status] || order.status}</span>
                          {order.tracking_number && <span className="font-mono">{order.tracking_number}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${st.color} ${st.bg}`}>
                        <Icon className="h-3.5 w-3.5" />{st.label}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
