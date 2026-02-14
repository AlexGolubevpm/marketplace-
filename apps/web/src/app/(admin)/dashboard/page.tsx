"use client";

import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  Clock,
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  Plus,
  Send,
  Download,
  Truck,
} from "lucide-react";
import Link from "next/link";

// Mock data for demonstration
const mockKpis = {
  newRequests: { value: 24, trend: 12.5 },
  avgFirstResponse: { value: "1ч 45м", color: "yellow" as const },
  avgOffers: { value: 2.8, color: "yellow" as const },
  conversionRate: { value: "52%", color: "yellow" as const },
  activeOrders: { value: 18, trend: 5.2 },
  slaViolations: { value: 2, color: "red" as const },
};

const mockEvents = [
  { id: 1, type: "request", text: "Новая заявка REQ-2026-0142 создана", time: "2 мин назад", color: "bg-green-500" },
  { id: 2, type: "offer", text: "Карго «FastCargo» ответил оффером на REQ-2026-0138", time: "15 мин назад", color: "bg-blue-500" },
  { id: 3, type: "order", text: "Клиент выбрал оффер — создан заказ ORD-2026-0089", time: "32 мин назад", color: "bg-purple-500" },
  { id: 4, type: "sla", text: "SLA нарушен: заявка REQ-2026-0135 без ответа > 4ч", time: "1ч назад", color: "bg-red-500" },
  { id: 5, type: "complete", text: "Заказ ORD-2026-0076 завершён — доставка подтверждена", time: "2ч назад", color: "bg-emerald-500" },
  { id: 6, type: "carrier", text: "Карго «SilkWay Express» приостановлен", time: "3ч назад", color: "bg-yellow-500" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Обзор ключевых метрик и событий" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Новые заявки (24ч)"
          value={mockKpis.newRequests.value}
          trend={mockKpis.newRequests.trend}
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <KpiCard
          title="Ср. время ответа"
          value={mockKpis.avgFirstResponse.value}
          color={mockKpis.avgFirstResponse.color}
          icon={<Clock className="h-4 w-4" />}
        />
        <KpiCard
          title="Офферов / заявка"
          value={mockKpis.avgOffers.value}
          color={mockKpis.avgOffers.color}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KpiCard
          title="Конверсия"
          value={mockKpis.conversionRate.value}
          color={mockKpis.conversionRate.color}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KpiCard
          title="Активные заказы"
          value={mockKpis.activeOrders.value}
          trend={mockKpis.activeOrders.trend}
          icon={<Package className="h-4 w-4" />}
        />
        <KpiCard
          title="SLA нарушения"
          value={mockKpis.slaViolations.value}
          color={mockKpis.slaViolations.color}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Лента событий</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${event.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{event.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Быстрые действия</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/carriers" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Truck className="h-4 w-4" />
                Добавить карго
              </Button>
            </Link>
            <Link href="/requests" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                Создать заявку
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Send className="h-4 w-4" />
              Массовое уведомление
            </Button>
            <Link href="/analytics" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Download className="h-4 w-4" />
                Экспорт отчёта
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
