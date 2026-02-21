"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ClipboardList, Clock, DollarSign, TrendingUp, Package, AlertTriangle,
  Plus, Truck, ArrowUpRight, ArrowDownRight, RefreshCw, Users,
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

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  matching: "Подбор",
  offers_received: "Есть офферы",
  offer_selected: "Оффер выбран",
  expired: "Истекла",
  closed: "Закрыта",
  cancelled: "Отменена",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  matching: "bg-blue-100 text-blue-700",
  offers_received: "bg-yellow-100 text-yellow-700",
  offer_selected: "bg-green-100 text-green-700",
  expired: "bg-gray-100 text-gray-500",
  closed: "bg-gray-100 text-gray-500",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<"today" | "7d" | "30d" | "90d" | "year">("30d");
  const { data, isLoading, error, refetch } = trpc.analytics.dashboard.useQuery({ period });
  const recentRequests = trpc.requests.list.useQuery({
    pagination: { page: 1, pageSize: 7 },
    sort: { field: "created_at", direction: "desc" },
  });

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => { refetch(); recentRequests.refetch(); }}
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            title="Обновить данные"
          >
            <RefreshCw className={`h-4 w-4 text-gray-500 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
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
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
          Ошибка загрузки данных: {error.message}
          <button onClick={() => refetch()} className="ml-2 underline hover:no-underline">
            Повторить
          </button>
        </div>
      )}

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
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Последние заявки</h2>
            <Link href="/admin/requests" className="text-xs text-blue-500 hover:text-blue-700">
              Все заявки
            </Link>
          </div>
          {recentRequests.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentRequests.data?.data && recentRequests.data.data.length > 0 ? (
            <div className="space-y-2">
              {recentRequests.data.data.map((r: any) => (
                <Link key={r.id} href={`/admin/requests/${r.id}`}>
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-medium text-gray-900 shrink-0">{r.display_id}</span>
                      <span className="text-sm text-gray-500 truncate">
                        {r.origin_city} &rarr; {r.destination_city}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-500"}`}>
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(r.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-8 text-center">Заявок пока нет</p>
          )}
        </div>
        <div className="p-5 rounded-xl border border-gray-200 bg-white">
          <h2 className="font-semibold text-gray-900 mb-4">Действия</h2>
          <div className="space-y-2">
            {[
              { href: "/admin/carriers", icon: Truck, label: "Добавить карго" },
              { href: "/admin/requests", icon: Plus, label: "Создать заявку" },
              { href: "/admin/customers", icon: Users, label: "Клиенты" },
              { href: "/admin/analytics", icon: TrendingUp, label: "Аналитика" },
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
