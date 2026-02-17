"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ClipboardList, Clock, DollarSign, TrendingUp, Package, AlertTriangle,
  Plus, Truck, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { trpc } from "@/trpc/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const periodLabels: Record<string, string> = {
  today: "Сегодня",
  "7d": "7 дней",
  "30d": "30 дней",
  "90d": "90 дней",
  year: "Год",
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<"today" | "7d" | "30d" | "90d" | "year">("30d");
  const { data, isLoading } = trpc.analytics.dashboard.useQuery({ period });

  const kpis = [
    {
      title: "Заявки",
      value: data?.newRequests.value ?? "—",
      trend: data?.newRequests.trend ?? 0,
      icon: ClipboardList,
      color: "text-blue-500",
    },
    {
      title: "Ср. время ответа",
      value: data?.avgFirstResponse.value ? `${data.avgFirstResponse.value} мин` : "—",
      trend: data?.avgFirstResponse.trend ?? 0,
      icon: Clock,
      color: "text-yellow-500",
    },
    {
      title: "Офферов / заявка",
      value: data?.avgOffersPerRequest.value ?? "—",
      trend: data?.avgOffersPerRequest.trend ?? 0,
      icon: DollarSign,
      color: "text-indigo-500",
    },
    {
      title: "Конверсия",
      value: data?.conversionRate.value != null ? `${data.conversionRate.value}%` : "—",
      trend: data?.conversionRate.trend ?? 0,
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      title: "Активные заказы",
      value: data?.activeOrders.value ?? "—",
      trend: data?.activeOrders.trend ?? 0,
      icon: Package,
      color: "text-purple-500",
    },
    {
      title: "SLA нарушения",
      value: data?.slaViolations.value ?? "0",
      trend: data?.slaViolations.trend ?? 0,
      icon: AlertTriangle,
      color: (data?.slaViolations.value ?? 0) > 0 ? "text-red-500" : "text-gray-300",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px] bg-white border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(periodLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.title} className={`p-4 rounded-xl border border-gray-200 bg-white ${isLoading ? "animate-pulse" : ""}`}>
              <Icon className={`h-4 w-4 ${kpi.color} mb-3`} />
              <div className="text-2xl font-bold text-gray-900">{isLoading ? "—" : kpi.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{kpi.title}</div>
              {!isLoading && kpi.trend !== 0 && (
                <div className={`flex items-center gap-0.5 mt-1 text-xs ${kpi.trend > 0 ? "text-green-500" : "text-red-500"}`}>
                  {kpi.trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(Math.round(kpi.trend))}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-5 rounded-xl border border-gray-200 bg-white">
          <h2 className="font-semibold text-gray-900 mb-4">Лента событий</h2>
          <p className="text-sm text-gray-400 py-8 text-center">События появятся здесь в реальном времени</p>
        </div>
        <div className="p-5 rounded-xl border border-gray-200 bg-white">
          <h2 className="font-semibold text-gray-900 mb-4">Действия</h2>
          <div className="space-y-2">
            {[
              { href: "/carriers", icon: Truck, label: "Добавить карго" },
              { href: "/requests", icon: Plus, label: "Создать заявку" },
            ].map((a) => (
              <Link key={a.href} href={a.href}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer">
                  <a.icon className="h-4 w-4" />{a.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
