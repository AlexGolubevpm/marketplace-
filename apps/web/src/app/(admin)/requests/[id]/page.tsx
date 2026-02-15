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
  FileText,
  Upload,
  Download,
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

interface DocFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_by_role: string;
  created_at: string;
}

const orderStatusLabels: Record<string, string> = {
  payment_pending: "Ожидает оплаты",
  confirmed: "Подтверждён",
  awaiting_shipment: "Ожидает отгрузки",
  in_transit: "В пути",
  customs: "Таможня",
  customs_hold: "Задержка на таможне",
  delivered: "Доставлен",
  completed: "Завершён",
  cancelled: "Отменён",
  dispute: "Спор",
  on_hold: "На удержании",
  partially_delivered: "Частично доставлен",
  return: "Возврат",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  invoice: "Инвойс",
  customs_declaration: "Таможенная декларация",
  bill_of_lading: "Коносамент",
  photo: "Фото",
  contract: "Договор",
  other: "Другое",
};

export default function RequestDetailPage() {
  const params = useParams();
  const [request, setRequest] = useState<Request | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [order, setOrder] = useState<any>(null);
  const [documents, setDocuments] = useState<DocFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getRequestById(params.id as string) as any;
      if (data) {
        setRequest(data);
        setOffers(data.offers || []);
        if (data.order) setOrder(data.order);
        if (data.documents) setDocuments(data.documents);
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

      {/* Order status management */}
      {order && (
        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-400" />
              <h2 className="font-semibold">Заказ {order.display_id}</h2>
              <StatusBadge status={order.status} type="order" />
            </div>
            <Select value={order.status} onValueChange={async (v) => {
              try {
                await fetch("/api/orders", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: order.id, status: v }),
                });
                await load();
              } catch (e: any) { setError(e.message); }
            }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(orderStatusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-white/40">Цена:</span> <span className="font-medium">${parseFloat(order.price).toLocaleString()}</span></div>
            {order.tracking_number && <div><span className="text-white/40">Трекинг:</span> <span className="font-mono font-medium">{order.tracking_number}</span></div>}
            <div><span className="text-white/40">Создан:</span> <span className="font-medium">{new Date(order.created_at).toLocaleDateString("ru-RU")}</span></div>
          </div>
        </div>
      )}

      {/* Documents */}
      {order && (
        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-400" />
              <h2 className="font-semibold">Документы</h2>
              {documents.length > 0 && <span className="text-white/30 text-sm">({documents.length})</span>}
            </div>
            <label className={`inline-flex items-center px-4 py-2 rounded-lg border border-white/10 text-sm font-medium cursor-pointer hover:bg-white/5 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
              <Upload className="h-4 w-4 mr-1.5" />
              {uploading ? "Загрузка..." : "Загрузить"}
              <input type="file" className="hidden" disabled={uploading} onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const formData = new FormData();
                  formData.append("file", file);
                  const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                  if (!uploadRes.ok) throw new Error("Upload failed");
                  const { url } = await uploadRes.json();
                  await fetch("/api/documents", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ order_id: order.id, file_name: file.name, file_url: url, file_type: "other", uploaded_by_role: "admin" }),
                  });
                  await load();
                } catch (err) { console.error("Upload error:", err); }
                setUploading(false);
                e.target.value = "";
              }} />
            </label>
          </div>
          {documents.length === 0 ? (
            <p className="text-sm text-white/20">Нет загруженных документов</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 text-white/30 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.file_name}</p>
                      <p className="text-xs text-white/20">{DOC_TYPE_LABELS[doc.file_type] || doc.file_type} · {doc.uploaded_by_role} · {new Date(doc.created_at).toLocaleDateString("ru-RU")}</p>
                    </div>
                  </div>
                  <a href={doc.file_url} download className="p-2 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0">
                    <Download className="h-4 w-4 text-cyan-400" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Meta info */}
      <div className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] text-xs text-white/20 space-y-1">
        <p>ID: {request.id}</p>
        <p>Customer ID: {request.customer_id}</p>
        <p>Обновлена: {new Date(request.updated_at).toLocaleString("ru-RU")}</p>
      </div>
    </div>
  );
}
