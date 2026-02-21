"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, CheckCircle2, Clock, Truck, Plane, Anchor, Train,
  DollarSign, FileText, Upload, Download, MessageSquare, Package,
  ChevronDown, Hash
} from "lucide-react";
import { getSession } from "@/lib/auth";

const deliveryIcons: Record<string, any> = { air: Plane, sea: Anchor, rail: Train, road: Truck };
const deliveryLabels: Record<string, string> = { air: "Авиа", sea: "Море", rail: "ЖД", road: "Авто", multimodal: "Мульти" };

const ORDER_STATUS_LABELS: Record<string, string> = {
  payment_pending: "Ожидает оплаты",
  confirmed: "Подтверждён",
  awaiting_shipment: "Ожидает отгрузки",
  in_transit: "В пути",
  customs: "На таможне",
  customs_hold: "Задержка на таможне",
  delivered: "Доставлен",
  completed: "Завершён",
  cancelled: "Отменён",
};

const ORDER_TIMELINE = [
  { key: "confirmed", label: "Оффер выбран" },
  { key: "awaiting_shipment", label: "Груз передан карго" },
  { key: "in_transit", label: "В пути" },
  { key: "customs", label: "Таможня" },
  { key: "delivered", label: "Доставлено" },
  { key: "completed", label: "Завершён" },
];

const ORDER_STEP_INDEX: Record<string, number> = {};
ORDER_TIMELINE.forEach((s, i) => { ORDER_STEP_INDEX[s.key] = i; });
ORDER_STEP_INDEX["customs_hold"] = ORDER_STEP_INDEX["customs"];
ORDER_STEP_INDEX["payment_pending"] = -1;

const CARRIER_STATUSES = [
  "confirmed",
  "awaiting_shipment",
  "in_transit",
  "customs",
  "customs_hold",
  "delivered",
  "completed",
];

interface DocFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_by_role: string;
  created_at: string;
}

export default function CarrierOfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params.id as string;

  const [request, setRequest] = useState<any>(null);
  const [offer, setOffer] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [documents, setDocuments] = useState<DocFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingSaving, setTrackingSaving] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async () => {
    try {
      // First, get the offer to find request_id
      const session = getSession("carrier");
      const carrierId = session?.user_id || session?.tg_id || session?.username || "carrier";
      const offersRes = await fetch(`/api/offers?carrier_id=${carrierId}`);
      if (!offersRes.ok) return;
      const offers = await offersRes.json();
      const myOffer = offers.find((o: any) => o.id === offerId);
      if (!myOffer) {
        setLoading(false);
        return;
      }
      setOffer(myOffer);

      // Load the full request with order and documents
      const reqRes = await fetch(`/api/requests/${myOffer.request_id}`);
      if (!reqRes.ok) return;
      const reqData = await reqRes.json();
      setRequest(reqData);
      if (reqData.order) {
        setOrder(reqData.order);
        setTrackingNumber(reqData.order.tracking_number || "");
      }
      setDocuments(reqData.documents || []);
    } catch (e) {
      console.error("Failed to load:", e);
    }
    setLoading(false);
  }, [offerId]);

  useEffect(() => {
    reload();
    const interval = setInterval(reload, 10000);
    return () => clearInterval(interval);
  }, [reload]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    setStatusUpdating(true);
    setStatusDropdownOpen(false);
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, status: newStatus }),
      });
      await reload();
    } catch (e) {
      console.error("Failed to update status:", e);
    }
    setStatusUpdating(false);
  };

  const handleTrackingSave = async () => {
    if (!order) return;
    setTrackingSaving(true);
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, tracking_number: trackingNumber }),
      });
      await reload();
    } catch (e) {
      console.error("Failed to save tracking:", e);
    }
    setTrackingSaving(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !order) return;
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
        body: JSON.stringify({
          order_id: order.id,
          file_name: file.name,
          file_url: url,
          file_type: "other",
          uploaded_by_role: "carrier",
        }),
      });
      await reload();
    } catch (err) {
      console.error("Upload error:", err);
    }
    setUploading(false);
    e.target.value = "";
  };

  const startChat = async () => {
    if (!request) return;
    const session = getSession("carrier");
    if (!session) return;
    try {
      await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: request.id,
          customer_id: request.customer_id,
          carrier_id: session.user_id || session.tg_id,
        }),
      });
      router.push("/s/chats");
    } catch (err) { console.error("Failed to start chat:", err); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!offer || !request) {
    return <div className="text-center py-20 text-gray-500">Оффер не найден</div>;
  }

  const price = typeof offer.price === "string" ? parseFloat(offer.price) : offer.price;
  const DIcon = deliveryIcons[offer.delivery_type] || Truck;
  const isSelected = offer.status === "selected";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/s/offers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-600 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Мои офферы
      </Link>

      {/* Request info */}
      <div className="p-5 rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 text-lg font-bold mb-3">
          <MapPin className="h-5 w-5 text-indigo-400" />
          {request.origin_city}, {request.origin_country} <span className="text-gray-400">&rarr;</span> {request.destination_city}, {request.destination_country}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <span>{request.display_id}</span>
          <span>&middot;</span>
          <span>{new Date(request.created_at).toLocaleDateString("ru-RU")}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><span className="text-gray-500">Груз:</span> <span className="font-medium">{request.cargo_description}</span></div>
          {request.weight_kg && <div><span className="text-gray-500">Вес:</span> <span className="font-medium">{parseFloat(request.weight_kg).toLocaleString()} кг</span></div>}
          {request.volume_m3 && <div><span className="text-gray-500">Объём:</span> <span className="font-medium">{request.volume_m3} м³</span></div>}
          {request.delivery_type_preferred && <div><span className="text-gray-500">Тип:</span> <span className="font-medium">{deliveryLabels[request.delivery_type_preferred] || "Любой"}</span></div>}
        </div>
      </div>

      {/* Offer info */}
      <div className={`p-5 rounded-2xl border ${isSelected ? "border-green-500/20 bg-green-500/[0.03]" : "border-gray-200 bg-white"}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isSelected ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <Clock className="h-5 w-5 text-blue-400" />}
            <h2 className="font-semibold">{isSelected ? "Оффер выбран клиентом" : "Оффер ожидает решения"}</h2>
          </div>
          <span className="text-sm text-gray-400">{offer.display_id}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-2xl font-bold">${price.toLocaleString()}</div>
          <div className="text-center">
            <div className="font-semibold">{offer.estimated_days || "—"}</div>
            <div className="text-xs text-gray-400">дней</div>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <DIcon className="h-4 w-4" /> {deliveryLabels[offer.delivery_type] || offer.delivery_type}
          </div>
        </div>
        {offer.conditions && <p className="mt-3 text-sm text-gray-500">{offer.conditions}</p>}
      </div>

      {/* Order section - only when offer is selected */}
      {isSelected && order && (
        <>
          {/* Status management */}
          <div className="p-5 rounded-2xl border border-gray-200 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-400" />
                Заказ {order.display_id}
              </h2>
              <button
                onClick={startChat}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-all flex items-center gap-1.5"
              >
                <MessageSquare className="h-4 w-4" /> Чат с клиентом
              </button>
            </div>

            {/* Status changer */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Статус:</span>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  disabled={statusUpdating}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {statusUpdating ? "Обновляем..." : ORDER_STATUS_LABELS[order.status] || order.status}
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${statusDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {statusDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 rounded-xl border border-gray-200 bg-white shadow-lg z-50 py-1 max-h-72 overflow-y-auto">
                    {CARRIER_STATUSES.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${order.status === status ? "bg-indigo-50 text-indigo-600 font-medium" : "text-gray-700"}`}
                      >
                        {ORDER_STATUS_LABELS[status] || status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tracking number */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 whitespace-nowrap">Трек-номер:</span>
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Введите трек-номер..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 text-sm font-mono"
                  />
                </div>
                <button
                  onClick={handleTrackingSave}
                  disabled={trackingSaving || trackingNumber === (order.tracking_number || "")}
                  className="px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {trackingSaving ? "..." : "Сохранить"}
                </button>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-5 rounded-2xl border border-gray-200 bg-white">
            <h2 className="font-semibold mb-4">Прогресс доставки</h2>
            <div className="space-y-0 pl-2">
              {(() => {
                const currentStep = ORDER_STEP_INDEX[order.status] ?? -1;
                return ORDER_TIMELINE.map((s, i, arr) => {
                  const done = i <= currentStep;
                  const isCurrent = i === currentStep;
                  return (
                    <div key={s.key} className="flex items-start gap-4 pb-5">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${done ? "bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]" : "bg-gray-200"} ${isCurrent ? "ring-2 ring-indigo-400/30" : ""}`} />
                        {i < arr.length - 1 && <div className={`w-0.5 flex-1 mt-1 ${done && i < currentStep ? "bg-indigo-400/30" : "bg-gray-200"}`} />}
                      </div>
                      <span className={`text-sm ${done ? "text-gray-900" : "text-gray-400"} ${isCurrent ? "font-semibold" : ""}`}>{s.label}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Documents */}
          <div className="p-5 rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-400" />
                <h2 className="font-semibold">Документы</h2>
                {documents.length > 0 && <span className="text-gray-500 text-sm">({documents.length})</span>}
              </div>
              <label className={`px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                <Upload className="h-4 w-4 inline mr-1.5" />
                {uploading ? "Загрузка..." : "Загрузить"}
                <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
            {documents.length === 0 ? (
              <p className="text-sm text-gray-400">Нет загруженных документов</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-200">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{doc.file_name}</p>
                        <p className="text-xs text-gray-400">{doc.uploaded_by_role} &middot; {new Date(doc.created_at).toLocaleDateString("ru-RU")}</p>
                      </div>
                    </div>
                    <a href={doc.file_url} download className="p-2 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0">
                      <Download className="h-4 w-4 text-indigo-400" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
