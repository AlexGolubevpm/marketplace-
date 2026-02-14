"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Mock data
const funnelData = [
  { label: "Заявка создана", count: 156, percent: 100 },
  { label: "≥ 1 оффер", count: 118, percent: 76 },
  { label: "≥ 3 офферов", count: 72, percent: 46 },
  { label: "Оффер выбран", count: 84, percent: 54 },
  { label: "Заказ подтверждён", count: 78, percent: 50 },
  { label: "Доставка завершена", count: 52, percent: 33 },
];

const carrierMetrics = [
  { name: "SilkWay Express", avgTime: "45 мин", responseRate: "86%", winRate: "34%", avgPrice: "$4,200", disputes: 0 },
  { name: "GlobalFreight", avgTime: "65 мин", responseRate: "78%", winRate: "38%", avgPrice: "$3,800", disputes: 1 },
  { name: "FastCargo", avgTime: "85 мин", responseRate: "69%", winRate: "39%", avgPrice: "$5,100", disputes: 0 },
  { name: "RailBridge", avgTime: "2ч 00м", responseRate: "76%", winRate: "39%", avgPrice: "$3,200", disputes: 2 },
  { name: "ChinaRoad", avgTime: "3ч 20м", responseRate: "58%", winRate: "23%", avgPrice: "$2,800", disputes: 3 },
];

const geoData = [
  { route: "CN → RU", requests: 98, avgPrice: "$5,200", avgDays: 18 },
  { route: "CN → KZ", requests: 32, avgPrice: "$3,800", avgDays: 15 },
  { route: "CN → UZ", requests: 15, avgPrice: "$4,100", avgDays: 20 },
  { route: "TR → RU", requests: 8, avgPrice: "$3,200", avgDays: 12 },
  { route: "CN → KG", requests: 3, avgPrice: "$3,500", avgDays: 22 },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30d");

  return (
    <div className="space-y-6">
      <PageHeader title="Аналитика" description="Метрики и аналитические отчёты">
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Сегодня</SelectItem>
              <SelectItem value="7d">7 дней</SelectItem>
              <SelectItem value="30d">30 дней</SelectItem>
              <SelectItem value="90d">Квартал</SelectItem>
              <SelectItem value="year">Год</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" /> Экспорт
          </Button>
        </div>
      </PageHeader>

      <Tabs defaultValue="funnel">
        <TabsList>
          <TabsTrigger value="funnel">Воронка</TabsTrigger>
          <TabsTrigger value="carriers">Метрики карго</TabsTrigger>
          <TabsTrigger value="geography">География</TabsTrigger>
          <TabsTrigger value="financial">Финансы</TabsTrigger>
        </TabsList>

        {/* Funnel */}
        <TabsContent value="funnel">
          <Card>
            <CardHeader>
              <CardTitle>Воронка конверсии</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {funnelData.map((step, i) => (
                  <div key={step.label} className="flex items-center gap-4">
                    <div className="w-48 text-sm font-medium">{step.label}</div>
                    <div className="flex-1">
                      <div className="relative h-8 bg-muted rounded">
                        <div
                          className="absolute inset-y-0 left-0 bg-primary/20 rounded"
                          style={{ width: `${step.percent}%` }}
                        >
                          <div
                            className="absolute inset-y-0 left-0 bg-primary rounded transition-all"
                            style={{ width: `${step.percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="w-20 text-right">
                      <span className="font-semibold">{step.count}</span>
                      <span className="text-muted-foreground text-sm ml-1">({step.percent}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Carrier Metrics */}
        <TabsContent value="carriers">
          <Card>
            <CardHeader>
              <CardTitle>Метрики карго</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Карго</th>
                      <th className="text-left py-3 px-2 font-medium">Ср. время ответа</th>
                      <th className="text-left py-3 px-2 font-medium">% ответов</th>
                      <th className="text-left py-3 px-2 font-medium">% побед</th>
                      <th className="text-left py-3 px-2 font-medium">Ср. цена</th>
                      <th className="text-left py-3 px-2 font-medium">Споры</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrierMetrics.map((c) => (
                      <tr key={c.name} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium">{c.name}</td>
                        <td className="py-3 px-2">{c.avgTime}</td>
                        <td className="py-3 px-2">{c.responseRate}</td>
                        <td className="py-3 px-2">{c.winRate}</td>
                        <td className="py-3 px-2">{c.avgPrice}</td>
                        <td className="py-3 px-2">
                          <Badge variant={c.disputes === 0 ? "success" : c.disputes <= 2 ? "warning" : "danger"}>
                            {c.disputes}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geography */}
        <TabsContent value="geography">
          <Card>
            <CardHeader>
              <CardTitle>Аналитика по направлениям</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Направление</th>
                      <th className="text-left py-3 px-2 font-medium">Заявок</th>
                      <th className="text-left py-3 px-2 font-medium">Ср. цена</th>
                      <th className="text-left py-3 px-2 font-medium">Ср. срок (дней)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {geoData.map((g) => (
                      <tr key={g.route} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium">{g.route}</td>
                        <td className="py-3 px-2">{g.requests}</td>
                        <td className="py-3 px-2">{g.avgPrice}</td>
                        <td className="py-3 px-2">{g.avgDays}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial */}
        <TabsContent value="financial">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">GMV (объём сделок)</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(245600)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Комиссия платформы</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(24560)}</p>
                <p className="text-sm text-muted-foreground mt-1">10% от GMV</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Средний чек</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(4730)}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground py-8">
                Графики GMV и распределения по карго будут доступны после подключения к реальным данным
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
