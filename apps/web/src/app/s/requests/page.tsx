"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Package, Clock, ChevronRight, Inbox } from "lucide-react";
import { getCarrierRequests, getOffersByCarrier, type Request } from "@/lib/store";
import { getSession } from "@/lib/auth";

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35 } }),
};

export default function CarrierRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [myOfferRequestIds, setMyOfferRequestIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"new" | "replied">("new");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const session = getSession();
      const carrierId = session?.tg_id || session?.username || "carrier";
      const [allReqs, myOffers] = await Promise.all([
        getCarrierRequests(),
        getOffersByCarrier(carrierId),
      ]);
      setRequests(allReqs);
      setMyOfferRequestIds(new Set(myOffers.map((o) => o.request_id)));
    } catch (e) {
      console.error("Failed to load:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const newRequests = requests.filter((r) => !myOfferRequestIds.has(r.id) && r.status !== "offer_selected");
  const repliedRequests = requests.filter((r) => myOfferRequestIds.has(r.id));
  const displayed = tab === "new" ? newRequests : repliedRequests;

  if (loading) {
    return <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-24 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Заявки</h1>

      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        {[
          { key: "new" as const, label: "Новые", count: newRequests.length },
          { key: "replied" as const, label: "Ответил", count: repliedRequests.length },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.key ? "bg-white/[0.08] text-white" : "text-white/30 hover:text-white/50"}`}>
            {t.label}
            <span className={`px-1.5 py-0.5 rounded-md text-xs ${tab === t.key ? "bg-indigo-500/20 text-indigo-400" : "bg-white/[0.04] text-white/20"}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="h-8 w-8 text-white/10 mb-3" />
          <p className="text-white/30">{tab === "new" ? "Нет новых заявок" : "Вы ещё не ответили ни на одну заявку"}</p>
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" key={tab} className="space-y-3">
          {displayed.map((req, i) => (
            <motion.div key={req.id} variants={fadeUp} custom={i}>
              <Link href={`/s/requests/${req.id}`}>
                <div className="group p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 font-semibold">
                        <MapPin className="h-4 w-4 text-indigo-400" />
                        {req.origin_city}, {req.origin_country} <span className="text-white/20">→</span> {req.destination_city}, {req.destination_country}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-white/30">
                        {req.weight_kg && <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" />{parseFloat(req.weight_kg).toLocaleString()} кг</span>}
                        <span>{req.cargo_description}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(req.created_at).toLocaleDateString("ru-RU")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {tab === "new" ? (
                        <span className="px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 text-sm font-medium">Ответить</span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-white/30 text-sm">Оффер отправлен</span>
                      )}
                      <ChevronRight className="h-5 w-5 text-white/10 group-hover:text-white/30" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
