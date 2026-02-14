"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Package, Clock, ChevronRight, AlertCircle } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35 } }),
};

const tabs = [
  { key: "new", label: "Новые", count: 3 },
  { key: "replied", label: "Ответил", count: 5 },
  { key: "won", label: "Выбран", count: 2 },
  { key: "archive", label: "Архив", count: 12 },
];

const mockRequests = [
  { id: "r1", origin: "Shenzhen", destination: "Moscow", weight: "1 500 кг", volume: "12.5 м³", category: "Электроника", features: "Хрупкий груз", created_at: "14 фев, 10:30", deadline: "15 фев, 10:30", tab: "new" },
  { id: "r2", origin: "Guangzhou", destination: "Almaty", weight: "800 кг", volume: "6.2 м³", category: "Одежда", features: "", created_at: "13 фев, 09:00", deadline: "14 фев, 09:00", tab: "new" },
  { id: "r3", origin: "Yiwu", destination: "Novosibirsk", weight: "3 200 кг", volume: "25 м³", category: "Товары для дома", features: "Негабаритный", created_at: "13 фев, 08:00", deadline: "14 фев, 20:00", tab: "new" },
  { id: "r4", origin: "Istanbul", destination: "Moscow", weight: "2 300 кг", volume: "18 м³", category: "Текстиль", features: "", created_at: "12 фев, 15:00", deadline: "", tab: "replied" },
  { id: "r5", origin: "Guangzhou", destination: "Tashkent", weight: "450 кг", volume: "3.1 м³", category: "Электроника", features: "", created_at: "10 фев, 12:00", deadline: "", tab: "replied" },
  { id: "r6", origin: "Shenzhen", destination: "Ekaterinburg", weight: "600 кг", volume: "5 м³", category: "Запчасти", features: "", created_at: "8 фев, 10:00", deadline: "", tab: "won" },
];

export default function CarrierRequestsPage() {
  const [activeTab, setActiveTab] = useState("new");

  const filtered = mockRequests.filter((r) => r.tab === activeTab);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Заявки</h1>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white/[0.08] text-white"
                : "text-white/30 hover:text-white/50"
            }`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-md text-xs ${
              activeTab === tab.key ? "bg-indigo-500/20 text-indigo-400" : "bg-white/[0.04] text-white/20"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Request cards */}
      <motion.div initial="hidden" animate="visible" key={activeTab} className="space-y-3">
        {filtered.map((req, i) => (
          <motion.div key={req.id} variants={fadeUp} custom={i}>
            <Link href={`/s/requests/${req.id}`}>
              <div className="group p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <MapPin className="h-4 w-4 text-indigo-400" />
                      {req.origin} <span className="text-white/20">→</span> {req.destination}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-white/30">
                      <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" />{req.weight} / {req.volume}</span>
                      <span>{req.category}</span>
                      {req.features && <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-xs">{req.features}</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/20">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{req.created_at}</span>
                      {req.deadline && (
                        <span className="flex items-center gap-1 text-orange-400">
                          <AlertCircle className="h-3 w-3" />
                          Дедлайн: {req.deadline}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {activeTab === "new" && (
                      <span className="px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 text-sm font-medium">
                        Ответить
                      </span>
                    )}
                    {activeTab === "replied" && (
                      <span className="px-4 py-2 rounded-lg bg-white/[0.04] text-white/30 text-sm font-medium">
                        Редактировать
                      </span>
                    )}
                    {activeTab === "won" && (
                      <span className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-sm font-medium">
                        Выбран
                      </span>
                    )}
                    <ChevronRight className="h-5 w-5 text-white/10 group-hover:text-white/30 transition-colors" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="py-20 text-center text-white/20">Нет заявок в этой категории</div>
        )}
      </motion.div>
    </div>
  );
}
