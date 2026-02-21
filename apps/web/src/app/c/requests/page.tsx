"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Package, ChevronRight, Plus, Clock, Inbox } from "lucide-react";
import { getRequests, type Request } from "@/lib/store";
import { getSession } from "@/lib/auth";
import { requestStatusConfig, activeStatuses } from "@/lib/request-status";

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35 } }),
};

export default function CustomerRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const session = getSession("customer");
    const userId = session?.user_id || session?.tg_id || session?.username || "anonymous";
    try {
      const data = await getRequests(userId);
      setRequests(data);
    } catch (e) {
      console.error("Failed to load requests:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-white border border-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  const active = requests.filter((r) => activeStatuses(r.status));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Мои заявки</h1>
        <Link href="/c/requests/new">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-medium text-sm hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all active:scale-[0.98]">
            <Plus className="h-4 w-4" /> Новая заявка
          </button>
        </Link>
      </div>

      {active.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Inbox className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-gray-500 text-lg mb-2">Пока нет заявок</p>
          <p className="text-gray-400 text-sm mb-6">Создайте первую заявку и получите предложения от карго-компаний</p>
          <Link href="/c/requests/new">
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-medium">
              <Plus className="h-4 w-4" /> Создать заявку
            </button>
          </Link>
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" className="space-y-3">
          {active.map((req, i) => {
            const st = requestStatusConfig[req.status] || statusConfig.new;
            return (
              <motion.div key={req.id} variants={fadeUp} custom={i}>
                <Link href={`/c/requests/${req.id}`}>
                  <div className="group p-5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 transition-all cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                          <MapPin className="h-4 w-4 text-cyan-400" />
                          {req.origin_city || req.origin_country}
                          <span className="text-gray-400">→</span>
                          {req.destination_city || req.destination_country}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {req.weight_kg && (
                            <span className="flex items-center gap-1">
                              <Package className="h-3.5 w-3.5" />
                              {parseFloat(req.weight_kg).toLocaleString()} кг
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(req.created_at).toLocaleDateString("ru-RU")}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${st.color} ${st.bg}`}>{st.label}</span>
                          {req.offer_count > 0 && (
                            <span className="text-sm text-cyan-400 font-medium">{req.offer_count} предложений</span>
                          )}
                          {req.status === "matching" && (
                            <span className="flex items-center gap-1 text-xs text-indigo-400">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" /> Ищем...
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 transition-colors mt-1" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
