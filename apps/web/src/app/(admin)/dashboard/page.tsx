"use client";

import Link from "next/link";
import {
  ClipboardList, Clock, DollarSign, TrendingUp, Package, AlertTriangle,
  Plus, Truck,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { title: "Заявки (24ч)", value: "0", icon: ClipboardList, color: "text-blue-500" },
          { title: "Ср. время ответа", value: "—", icon: Clock, color: "text-yellow-500" },
          { title: "Офферов / заявка", value: "0", icon: DollarSign, color: "text-indigo-500" },
          { title: "Конверсия", value: "—", icon: TrendingUp, color: "text-green-500" },
          { title: "Активные заказы", value: "0", icon: Package, color: "text-purple-500" },
          { title: "SLA нарушения", value: "0", icon: AlertTriangle, color: "text-gray-300" },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.title} className="p-4 rounded-xl border border-gray-200 bg-white">
              <Icon className={`h-4 w-4 ${kpi.color} mb-3`} />
              <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{kpi.title}</div>
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
