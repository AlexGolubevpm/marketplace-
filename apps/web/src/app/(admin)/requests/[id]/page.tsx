"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  MapPin,
  Package,
  Clock,
  User,
  X,
  RotateCcw,
  CalendarPlus,
  UserPlus,
} from "lucide-react";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";

// Mock detailed request data
const mockRequest = {
  id: "1",
  display_id: "REQ-2026-0142",
  status: "offers_received",
  source: "telegram_bot",
  created_at: "2026-02-14T10:30:00",
  offer_deadline: "2026-02-15T10:30:00",
  sla_violated: false,
  origin_country: "CN",
  origin_city: "Гуанчжоу",
  destination_country: "RU",
  destination_city: "Москва",
  cargo_description: "Электроника: смартфоны, зарядные устройства, наушники. Упаковка в коробках на паллетах.",
  weight_kg: "1500.00",
  volume_m3: "12.500",
  cargo_type: "general",
  delivery_type_preferred: "any",
  budget_min: "5000.00",
  budget_max: "8000.00",
  customer: {
    id: "c1",
    full_name: "Иванов Алексей",
    telegram_username: "@alexivanov",
    company_name: "ТехноИмпорт",
  },
  offers: [
    { id: "o1", display_id: "OFF-2026-0201", carrier_name: "FastCargo", price: "6200.00", estimated_days: 18, delivery_type: "sea", status: "active" },
    { id: "o2", display_id: "OFF-2026-0202", carrier_name: "SilkWay Express", price: "8500.00", estimated_days: 7, delivery_type: "air", status: "active" },
    { id: "o3", display_id: "OFF-2026-0203", carrier_name: "RailBridge", price: "5800.00", estimated_days: 22, delivery_type: "rail", status: "active" },
  ],
  matches: [
    { carrier_name: "FastCargo", sent_at: "2026-02-14T10:35:00", viewed_at: "2026-02-14T10:50:00", responded: true },
    { carrier_name: "SilkWay Express", sent_at: "2026-02-14T10:35:00", viewed_at: "2026-02-14T11:00:00", responded: true },
    { carrier_name: "RailBridge", sent_at: "2026-02-14T10:35:00", viewed_at: "2026-02-14T11:20:00", responded: true },
    { carrier_name: "ChinaRoad", sent_at: "2026-02-14T10:35:00", viewed_at: null, responded: false },
    { carrier_name: "GlobalFreight", sent_at: "2026-02-14T10:35:00", viewed_at: "2026-02-14T12:00:00", responded: false },
  ],
};

export default function RequestDetailPage() {
  const params = useParams();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/requests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{mockRequest.display_id}</h1>
            <StatusBadge status={mockRequest.status} type="request" />
            <Badge variant="outline">{mockRequest.source}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Создана {formatDateTime(mockRequest.created_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Маршрут
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-lg">
                <div className="text-center">
                  <div className="font-semibold">{mockRequest.origin_country}</div>
                  <div className="text-sm text-muted-foreground">{mockRequest.origin_city}</div>
                </div>
                <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30 relative">
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-muted-foreground text-sm">→</span>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{mockRequest.destination_country}</div>
                  <div className="text-sm text-muted-foreground">{mockRequest.destination_city}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cargo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" /> Груз
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{mockRequest.cargo_description}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Вес:</span>
                  <span className="ml-2 font-medium">{parseFloat(mockRequest.weight_kg).toLocaleString()} кг</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Объём:</span>
                  <span className="ml-2 font-medium">{mockRequest.volume_m3} м³</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Бюджет:</span>
                  <span className="ml-2 font-medium">{formatCurrency(mockRequest.budget_min)} – {formatCurrency(mockRequest.budget_max)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Тип:</span>
                  <span className="ml-2 font-medium">{mockRequest.cargo_type}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Offers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Офферы ({mockRequest.offers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockRequest.offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <Link href={`/offers`} className="font-medium text-sm hover:text-primary">
                          {offer.display_id}
                        </Link>
                        <p className="text-sm text-muted-foreground">{offer.carrier_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(offer.price)}</div>
                        <div className="text-muted-foreground">{offer.estimated_days} дней</div>
                      </div>
                      <Badge variant="outline">{offer.delivery_type}</Badge>
                      <StatusBadge status={offer.status} type="offer" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Carrier Matches */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Матчинг карго ({mockRequest.matches.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockRequest.matches.map((match, i) => (
                  <div key={i} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-medium">{match.carrier_name}</span>
                    <div className="flex items-center gap-3">
                      {match.viewed_at ? (
                        <Badge variant="info">Просмотрел</Badge>
                      ) : (
                        <Badge variant="gray">Не просмотрел</Badge>
                      )}
                      {match.responded ? (
                        <Badge variant="success">Ответил</Badge>
                      ) : (
                        <Badge variant="warning">Без ответа</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                <X className="h-4 w-4" /> Закрыть заявку
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                <RotateCcw className="h-4 w-4" /> Пересоздать
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                <CalendarPlus className="h-4 w-4" /> Продлить дедлайн
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                <UserPlus className="h-4 w-4" /> Назначить менеджера
              </Button>
            </CardContent>
          </Card>

          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" /> Клиент
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>
                <span className="text-muted-foreground">Имя:</span>
                <span className="ml-2 font-medium">{mockRequest.customer.full_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Telegram:</span>
                <span className="ml-2">{mockRequest.customer.telegram_username}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Компания:</span>
                <span className="ml-2">{mockRequest.customer.company_name}</span>
              </div>
              <Link href={`/customers/${mockRequest.customer.id}`}>
                <Button variant="link" size="sm" className="px-0">
                  Профиль клиента →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* SLA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" /> SLA
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Статус SLA:</span>
                <span className={`font-medium ${mockRequest.sla_violated ? "text-red-600" : "text-green-600"}`}>
                  {mockRequest.sla_violated ? "Нарушен" : "В норме"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Дедлайн:</span>
                <span className="font-medium">{formatDateTime(mockRequest.offer_deadline)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Комментарии</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea placeholder="Добавить комментарий..." rows={3} />
              <Button size="sm">Отправить</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
