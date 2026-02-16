"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Package, Clock, ChevronRight, Archive } from "lucide-react";
import { getRequests, type Request } from "@/lib/store";
import { getSession } from "@/lib/auth";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  offer_selected: { label: "Оффер выбран", color: "text-purple-400", bg: "bg-purple-500/10" },
  completed: { label: "Завершено", color: "text-green-400", bg: "bg-green-500/10" },
  cancelled: { label: "Отменено", color: "text-red-400", bg: "bg-red-500/10" },
  expired: { label: "Истекла", color: "text-orange-400", bg: "bg-orange-500/10" },
};

export default function CustomerArchivePage() {
  const [requests, setRequests] = useState<Request[]>([]);

  useEffect(() => {
    async function load() {
      const session = getSession("customer");
      const userId = session?.user_id || session?.tg_id || session?.username || "anonymous";
      try {
        const all = await getRequests(userId);
        setRequests(all.filter((r) => ["offer_selected", "completed", "cancelled", "expired"].includes(r.status)));
      } catch {}
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Архив</h1>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Archive className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-gray-500">Завершённые и отменённые заявки появятся здесь</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const st = statusConfig[req.status] || { label: req.status, color: "text-gray-500", bg: "bg-white/5" };
            return (
              <Link key={req.id} href={`/c/requests/${req.id}`}>
                <div className="p-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition-all cursor-pointer mb-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {req.origin_city} → {req.destination_city}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{new Date(req.created_at).toLocaleDateString("ru-RU")}</span>
                        <span className={`px-2 py-0.5 rounded-full ${st.color} ${st.bg}`}>{st.label}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/10" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
