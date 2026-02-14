"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  ClipboardList,
  Clock,
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  Plus,
  Send,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const kpis = [
  { title: "Заявки (24ч)", value: "24", trend: "+12%", up: true, icon: ClipboardList, color: "text-cyan-400" },
  { title: "Ср. время ответа", value: "1ч 45м", trend: "", up: false, icon: Clock, color: "text-yellow-400" },
  { title: "Офферов / заявка", value: "2.8", trend: "+0.3", up: true, icon: DollarSign, color: "text-indigo-400" },
  { title: "Конверсия", value: "52%", trend: "+4%", up: true, icon: TrendingUp, color: "text-green-400" },
  { title: "Активные заказы", value: "18", trend: "+5", up: true, icon: Package, color: "text-purple-400" },
  { title: "SLA нарушения", value: "2", trend: "", up: false, icon: AlertTriangle, color: "text-red-400" },
];

const events = [
  { text: "Новая заявка REQ-2026-0142", time: "2 мин", dot: "bg-green-500" },
  { text: "FastCargo ответил на REQ-2026-0138", time: "15 мин", dot: "bg-blue-500" },
  { text: "Клиент выбрал оффер → ORD-2026-0089", time: "32 мин", dot: "bg-purple-500" },
  { text: "SLA нарушен: REQ-2026-0135", time: "1ч", dot: "bg-red-500" },
  { text: "Заказ ORD-2026-0076 завершён", time: "2ч", dot: "bg-emerald-500" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.title} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center justify-between mb-3">
                <Icon className={`h-4 w-4 ${kpi.color}`} />
                {kpi.trend && (
                  <span className={`flex items-center text-xs font-medium ${kpi.up ? "text-green-400" : "text-red-400"}`}>
                    {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {kpi.trend}
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="text-xs text-white/30 mt-0.5">{kpi.title}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Events */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <h2 className="font-semibold mb-4">Лента событий</h2>
          <div className="space-y-3">
            {events.map((e, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${e.dot}`} />
                <span className="text-sm flex-1">{e.text}</span>
                <span className="text-xs text-white/20">{e.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <h2 className="font-semibold mb-4">Действия</h2>
          <div className="space-y-2">
            {[
              { href: "/carriers", icon: Truck, label: "Добавить карго" },
              { href: "/requests", icon: Plus, label: "Создать заявку" },
              { href: "/analytics", icon: Send, label: "Экспорт отчёта" },
            ].map((a) => (
              <Link key={a.href} href={a.href}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer">
                  <a.icon className="h-4 w-4" />
                  {a.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
