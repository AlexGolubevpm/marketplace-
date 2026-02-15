"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Package,
  Calendar,
  RefreshCw,
  Truck,
  Plane,
  Anchor,
  Train,
  DollarSign,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Request, type Offer, getRequestById, updateRequestStatus } from "@/lib/store";

const deliveryLabels: Record<string, string> = {
  air: "Авиа",
  sea: "Море",
  rail: "ЖД",
  road: "Авто",
  multimodal: "Мульти",
  any: "Любой",
};

const cargoTypeLabels: Record<string, string> = {
  general: "Генеральный",
  fragile: "Хрупкий",
  dangerous: "Опасный",
  perishable: "Скоропортящийся",
  oversized: "Негабаритный",
};

const sourceLabels: Record<string, string> = {
  web_form: "Web",
  telegram_bot: "Telegram",
  admin_manual: "Админ",
  api: "API",
};

export default function RequestDetailPage() {
  const params = useParams();
  const [request, setRequest] = useState<Request | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getRequestById(params.id as string);
      if (data) {
        setRequest(data);
        setOffers(data.offers || []);
      } else {
        setError("Заявка не найдена");
      }
    } catch (e: any) {
      setError(e.message || "Ошибка загрузки");
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (newStatus: string) => {
    if (!request) return;
    setStatusUpdating(true);
    try {
      await updateRequestStatus(request.id, newStatus);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
    setStatusUpdating(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Link href="/requests" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60">
          <ArrowLeft className="h-4 w-4" /> Назад
        </Link>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-white/[0.02] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="space-y-6">
        <Link href="/requests" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60">
          <ArrowLeft className="h-4 w-4" /> Назад
        </Link>
        <div className="p-6 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-center">
          {error || "Заявка не найдена"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/requests" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60">
          <ArrowLeft className="h-4 w-4" /> Назад к заявкам
        </Link>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-2" /> Обновить
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{request.display_id}</h1>
            <StatusBadge status={request.status} type="request" />
          </div>
          <p className="text-sm text-white/30 mt-1">
            Создана: {new Date(request.created_at).toLocaleString("ru-RU")} | Источник: {sourceLabels[request.source] || request.source}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/30">Статус:</span>
          <Select value={request.status} onValueChange={handleStatusChange} disabled={statusUpdating}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Новая</SelectItem>
              <SelectItem value="matching">Подбор карго</SelectItem>
              <SelectItem value="offers_received">Офферы получены</SelectItem>
              <SelectItem value="offer_selected">Оффер выбран</SelectItem>
              <SelectItem value="expired">Истекла</SelectItem>
              <SelectItem value="closed">Закрыта</SelectItem>
              <SelectItem value="cancelled">Отменена</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Route & Cargo details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-cyan-400" />
            <h2 className="font-semibold">Маршрут</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/40">Откуда</span>
              <span className="font-medium">{request.origin_city}, {request.origin_country}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Куда</span>
              <span className="font-medium">{request.destination_city}, {request.destination_country}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Тип доставки</span>
              <span className="font-medium">{deliveryLabels[request.delivery_type_preferred || ""] || "Любой"}</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-indigo-400" />
            <h2 className="font-semibold">Груз</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/40">Описание</span>
              <span className="font-medium text-right max-w-[60%]">{request.cargo_description}</span>
            </div>
            {request.weight_kg && (
              <div className="flex justify-between">
                <span className="text-white/40">Вес</span>
                <span className="font-medium">{parseFloat(request.weight_kg).toLocaleString()} кг</span>
              </div>
            )}
            {request.volume_m3 && (
              <div className="flex justify-between">
                <span className="text-white/40">Объём</span>
                <span className="font-medium">{request.volume_m3} м³</span>
              </div>
            )}
            {request.cargo_type && (
              <div className="flex justify-between">
                <span className="text-white/40">Тип груза</span>
                <span className="font-medium">{cargoTypeLabels[request.cargo_type] || request.cargo_type}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Budget */}
      {(request.budget_min || request.budget_max) && (
        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-green-400" />
            <h2 className="font-semibold">Бюджет</h2>
          </div>
          <div className="flex gap-6 text-sm">
            {request.budget_min && (
              <div>
                <span className="text-white/40">Мин: </span>
                <span className="font-medium">${parseFloat(request.budget_min).toLocaleString()}</span>
              </div>
            )}
            {request.budget_max && (
              <div>
                <span className="text-white/40">Макс: </span>
                <span className="font-medium">${parseFloat(request.budget_max).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Offers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Офферы <span className="text-white/30">({offers.length})</span>
          </h2>
        </div>

        {offers.length === 0 ? (
          <div className="p-8 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center text-white/30">
            Нет офферов
          </div>
        ) : (
          <div className="rounded-lg border border-white/[0.06] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Карго</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Срок (дн)</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell className="font-mono text-sm">{offer.display_id}</TableCell>
                    <TableCell>{offer.carrier_name || "—"}</TableCell>
                    <TableCell className="font-medium">
                      ${(typeof offer.price === "string" ? parseFloat(offer.price) : offer.price).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {offer.estimated_days_min && offer.estimated_days_max
                        ? `${offer.estimated_days_min}-${offer.estimated_days_max}`
                        : offer.estimated_days || "—"}
                    </TableCell>
                    <TableCell>{deliveryLabels[offer.delivery_type] || offer.delivery_type}</TableCell>
                    <TableCell>
                      <StatusBadge status={offer.status} type="offer" />
                    </TableCell>
                    <TableCell className="text-white/40 text-sm">
                      {new Date(offer.created_at).toLocaleString("ru-RU")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Meta info */}
      <div className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] text-xs text-white/20 space-y-1">
        <p>ID: {request.id}</p>
        <p>Customer ID: {request.customer_id}</p>
        <p>Обновлена: {new Date(request.updated_at).toLocaleString("ru-RU")}</p>
      </div>
    </div>
  );
}
