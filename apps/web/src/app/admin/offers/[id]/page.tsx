"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  DollarSign,
  Truck,
  Calendar,
  User,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { deliveryTypeLabels } from "@cargo/shared";

interface OfferDetail {
  id: string;
  display_id: string;
  request_id: string;
  carrier_id: string;
  price: string;
  currency: string;
  estimated_days: number;
  delivery_type: string;
  conditions: string | null;
  status: string;
  selected_at: string | null;
  created_at: string;
  updated_at: string;
  carrier_name: string | null;
  carrier_contact: string | null;
  carrier_phone: string | null;
  carrier_email: string | null;
}

export default function OfferDetailPage() {
  const params = useParams();
  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/offers?offer_id=${params.id}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      const found = Array.isArray(data) ? data.find((o: any) => o.id === params.id) : data;
      if (found) {
        setOffer(found);
      } else {
        setError("Оффер не найден");
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
    if (!offer) return;
    setUpdating(true);
    try {
      if (newStatus === "selected") {
        await fetch("/api/offers", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offer_id: offer.id, action: "select" }),
        });
      }
      await load();
    } catch (e: any) {
      setError(e.message);
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Link href="/admin/offers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-600">
          <ArrowLeft className="h-4 w-4" /> Назад
        </Link>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-white animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="space-y-6">
        <Link href="/admin/offers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-600">
          <ArrowLeft className="h-4 w-4" /> Назад
        </Link>
        <div className="p-6 rounded-lg bg-red-50 border border-red-200 text-red-600 text-center">
          {error || "Оффер не найден"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/offers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-600">
          <ArrowLeft className="h-4 w-4" /> Назад к офферам
        </Link>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-2" /> Обновить
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{offer.display_id}</h1>
            <StatusBadge status={offer.status} type="offer" />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Создан: {new Date(offer.created_at).toLocaleString("ru-RU")}
          </p>
        </div>
        {offer.status === "active" && (
          <Button size="sm" onClick={() => handleStatusChange("selected")} disabled={updating}>
            {updating ? "Обработка..." : "Выбрать оффер"}
          </Button>
        )}
      </div>

      {/* Price & Delivery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-green-500" />
            <h2 className="font-semibold">Стоимость и доставка</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Цена</span>
              <span className="font-medium text-lg">${parseFloat(offer.price).toLocaleString()} {offer.currency !== "USD" ? offer.currency : ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Срок доставки</span>
              <span className="font-medium">{offer.estimated_days} дн.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Тип доставки</span>
              <span className="font-medium">{deliveryTypeLabels[offer.delivery_type] || offer.delivery_type}</span>
            </div>
            {offer.conditions && (
              <div className="flex justify-between">
                <span className="text-gray-500">Условия</span>
                <span className="font-medium text-right max-w-[60%]">{offer.conditions}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-blue-500" />
            <h2 className="font-semibold">Карго-компания</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Название</span>
              <span className="font-medium">{offer.carrier_name || "—"}</span>
            </div>
            {offer.carrier_contact && (
              <div className="flex justify-between">
                <span className="text-gray-500">Контакт</span>
                <span className="font-medium">{offer.carrier_contact}</span>
              </div>
            )}
            {offer.carrier_phone && (
              <div className="flex justify-between">
                <span className="text-gray-500">Телефон</span>
                <span className="font-medium">{offer.carrier_phone}</span>
              </div>
            )}
            {offer.carrier_email && (
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{offer.carrier_email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="flex gap-4">
        <Link href={`/admin/requests/${offer.request_id}`} className="text-sm text-blue-600 hover:underline">
          Заявка: {offer.request_id.slice(0, 8)}...
        </Link>
        <Link href={`/admin/carriers/${offer.carrier_id}`} className="text-sm text-blue-600 hover:underline">
          Карго: {offer.carrier_id.slice(0, 8)}...
        </Link>
      </div>

      {offer.selected_at && (
        <div className="p-4 rounded-xl border border-green-200 bg-green-50 text-sm text-green-700">
          Оффер выбран: {new Date(offer.selected_at).toLocaleString("ru-RU")}
        </div>
      )}

      {/* Meta */}
      <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-400 space-y-1">
        <p>ID: {offer.id}</p>
        <p>Request ID: {offer.request_id}</p>
        <p>Carrier ID: {offer.carrier_id}</p>
      </div>
    </div>
  );
}
