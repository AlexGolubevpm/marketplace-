"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Ban,
  Pause,
  Play,
  Send,
} from "lucide-react";
import { formatMinutesToDuration } from "@/lib/utils";

const mockCarrier = {
  id: "c2",
  name: "SilkWay Express",
  contact_name: "Ли Вэй",
  contact_phone: "+86 186 1234 5678",
  contact_email: "liwei@silkway.com",
  telegram_id: "@silkway_cargo",
  description: "Крупная карго-компания с фокусом на авиаперевозках из Китая в страны СНГ. Работает с 2018 года.",
  status: "active",
  sla_rating: "0.95",
  avg_response_time_minutes: 45,
  total_requests_received: 210,
  total_offers_made: 180,
  total_offers_won: 62,
  regions: [
    { country_from: "CN", city_from: "Гуанчжоу", country_to: "RU", city_to: "Москва" },
    { country_from: "CN", city_from: "Гуанчжоу", country_to: "UZ", city_to: "Ташкент" },
    { country_from: "CN", city_from: "Иу", country_to: "KG", city_to: "Бишкек" },
  ],
  deliveryTypes: [
    { type: "air", max_weight_kg: "5000", max_volume_m3: "100" },
    { type: "multimodal", max_weight_kg: "20000", max_volume_m3: "500" },
  ],
};

export default function CarrierDetailPage() {
  const conversionRate = mockCarrier.total_offers_made > 0
    ? ((mockCarrier.total_offers_won / mockCarrier.total_offers_made) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/carriers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{mockCarrier.name}</h1>
            <StatusBadge status={mockCarrier.status} type="carrier" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            SLA рейтинг: {(parseFloat(mockCarrier.sla_rating) * 100).toFixed(0)}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Pause className="h-4 w-4 mr-2" /> Приостановить
          </Button>
          <Button variant="destructive" size="sm">
            <Ban className="h-4 w-4 mr-2" /> Заблокировать
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Профиль</TabsTrigger>
          <TabsTrigger value="stats">Статистика</TabsTrigger>
          <TabsTrigger value="history">История</TabsTrigger>
          <TabsTrigger value="comments">Комментарии</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Контактные данные</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Название компании</Label>
                    <Input defaultValue={mockCarrier.name} className="mt-1" />
                  </div>
                  <div>
                    <Label>Контактное лицо</Label>
                    <Input defaultValue={mockCarrier.contact_name} className="mt-1" />
                  </div>
                  <div>
                    <Label>Телефон</Label>
                    <Input defaultValue={mockCarrier.contact_phone} className="mt-1" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input defaultValue={mockCarrier.contact_email} className="mt-1" />
                  </div>
                  <div>
                    <Label>Telegram</Label>
                    <Input defaultValue={mockCarrier.telegram_id} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>Описание</Label>
                  <Textarea defaultValue={mockCarrier.description} className="mt-1" rows={3} />
                </div>
                <Button>Сохранить изменения</Button>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Регионы</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mockCarrier.regions.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded border">
                        <span className="text-sm">
                          {r.country_from}, {r.city_from} → {r.country_to}, {r.city_to}
                        </span>
                        <Button variant="ghost" size="sm" className="text-destructive h-7">
                          Удалить
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="mt-2">
                      Добавить регион
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Типы доставки</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mockCarrier.deliveryTypes.map((d, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded border">
                        <div className="text-sm">
                          <Badge variant="secondary">{d.type}</Badge>
                          <span className="ml-2 text-muted-foreground">
                            до {parseFloat(d.max_weight_kg).toLocaleString()} кг / {d.max_volume_m3} м³
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Ср. время ответа</p>
                <p className="text-2xl font-bold mt-1">{formatMinutesToDuration(mockCarrier.avg_response_time_minutes)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Получено заявок</p>
                <p className="text-2xl font-bold mt-1">{mockCarrier.total_requests_received}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Отправлено офферов</p>
                <p className="text-2xl font-bold mt-1">{mockCarrier.total_offers_made}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Конверсия</p>
                <p className="text-2xl font-bold mt-1">{conversionRate}%</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground py-8">
                Графики будут доступны после подключения к реальным данным
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground py-8">
                История офферов карго будет доступна после подключения к реальным данным
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Textarea placeholder="Добавить приватный комментарий..." rows={3} />
              <Button size="sm">Отправить</Button>
              <p className="text-center text-muted-foreground py-4">
                Комментариев пока нет
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
