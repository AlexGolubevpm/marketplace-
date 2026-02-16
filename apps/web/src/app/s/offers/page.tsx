"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { DollarSign, Clock, CheckCircle2, XCircle, Clock3, Inbox, FileText, Upload, Download } from "lucide-react";
import { getOffersByCarrier, type Offer } from "@/lib/store";
import { getSession } from "@/lib/auth";

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35 } }),
};

const statusMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  active: { label: "Ожидает", color: "text-blue-400", bg: "bg-blue-500/10", icon: Clock3 },
  selected: { label: "Выбран!", color: "text-green-400", bg: "bg-green-500/10", icon: CheckCircle2 },
  rejected: { label: "Не выбран", color: "text-gray-500", bg: "bg-gray-100", icon: XCircle },
  expired: { label: "Истёк", color: "text-orange-400", bg: "bg-orange-500/10", icon: Clock },
};

const deliveryLabels: Record<string, string> = { air: "Авиа", sea: "Море", rail: "ЖД", road: "Авто" };

const ORDER_STATUS_LABELS: Record<string, string> = {
  payment_pending: "Ожидает оплаты",
  confirmed: "Подтверждён",
  awaiting_shipment: "Ожидает отгрузки",
  in_transit: "В пути",
  customs: "Таможня",
  customs_hold: "Задержка на таможне",
  delivered: "Доставлен",
  completed: "Завершён",
  cancelled: "Отменён",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  invoice: "Инвойс",
  customs_declaration: "Таможенная декларация",
  bill_of_lading: "Коносамент",
  photo: "Фото",
  contract: "Договор",
  other: "Другое",
};

interface DocFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_by_role: string;
  created_at: string;
}

interface OrderInfo {
  id: string;
  display_id: string;
  status: string;
  tracking_number?: string;
}

export default function CarrierOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderMap, setOrderMap] = useState<Record<string, OrderInfo>>({});
  const [docsMap, setDocsMap] = useState<Record<string, DocFile[]>>({});
  const [expandedOffer, setExpandedOffer] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const session = getSession();
      const carrierId = session?.tg_id || session?.username || "carrier";
      const data = await getOffersByCarrier(carrierId);
      setOffers(data);

      // For selected offers, fetch order + documents via request endpoint
      const selectedOffers = data.filter((o) => o.status === "selected");
      const newOrderMap: Record<string, OrderInfo> = {};
      const newDocsMap: Record<string, DocFile[]> = {};

      await Promise.all(
        selectedOffers.map(async (offer) => {
          try {
            const res = await fetch(`/api/requests/${offer.request_id}`);
            if (res.ok) {
              const req = await res.json();
              if (req.order) {
                newOrderMap[offer.id] = req.order;
                newDocsMap[offer.id] = req.documents || [];
              }
            }
          } catch {}
        })
      );

      setOrderMap(newOrderMap);
      setDocsMap(newDocsMap);
    } catch (e) {
      console.error("Failed to load offers:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  const handleUpload = async (offerId: string, orderId: string, file: File) => {
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
        body: JSON.stringify({ order_id: orderId, file_name: file.name, file_url: url, file_type: "other", uploaded_by_role: "carrier" }),
      });
      await load();
    } catch (err) {
      console.error("Upload error:", err);
    }
    setUploading(false);
  };

  if (loading) return <div className="space-y-3">{[1,2].map((i) => <div key={i} className="h-20 rounded-2xl bg-white border border-gray-200 animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Мои офферы</h1>
      {offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="h-8 w-8 text-gray-300 mb-3" />
          <p className="text-gray-500">Вы ещё не отправляли офферов</p>
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" className="space-y-3">
          {offers.map((offer, i) => {
            const st = statusMap[offer.status] || statusMap.active;
            const Icon = st.icon;
            const price = typeof offer.price === "string" ? parseFloat(offer.price) : offer.price;
            const order = orderMap[offer.id];
            const docs = docsMap[offer.id] || [];
            const isExpanded = expandedOffer === offer.id;

            return (
              <motion.div key={offer.id} variants={fadeUp} custom={i}>
                <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                  <div
                    className={`p-5 ${offer.status === "selected" ? "cursor-pointer hover:bg-gray-50" : ""}`}
                    onClick={() => offer.status === "selected" && setExpandedOffer(isExpanded ? null : offer.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="text-gray-900 font-semibold">${price.toLocaleString()}</span>
                          <span>{offer.estimated_days || "—"} дней</span>
                          <span>{deliveryLabels[offer.delivery_type] || offer.delivery_type}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(offer.created_at).toLocaleDateString("ru-RU")}</span>
                        </div>
                        {order && (
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>Заказ: {order.display_id}</span>
                            <span className="px-2 py-0.5 rounded bg-gray-50">{ORDER_STATUS_LABELS[order.status] || order.status}</span>
                            {order.tracking_number && <span className="font-mono">{order.tracking_number}</span>}
                          </div>
                        )}
                      </div>
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${st.color} ${st.bg}`}>
                        <Icon className="h-3.5 w-3.5" />{st.label}
                      </span>
                    </div>
                  </div>

                  {/* Expanded: documents */}
                  {isExpanded && order && (
                    <div className="px-5 pb-5 border-t border-gray-200">
                      <div className="flex items-center justify-between mt-4 mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-cyan-400" />
                          <span className="text-sm font-semibold">Документы</span>
                          {docs.length > 0 && <span className="text-gray-500 text-xs">({docs.length})</span>}
                        </div>
                        <label className={`inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium cursor-pointer hover:bg-gray-50 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                          <Upload className="h-3.5 w-3.5 mr-1" />
                          {uploading ? "..." : "Загрузить"}
                          <input type="file" className="hidden" disabled={uploading} onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(offer.id, order.id, file);
                            e.target.value = "";
                          }} />
                        </label>
                      </div>
                      {docs.length === 0 ? (
                        <p className="text-xs text-gray-400">Нет документов</p>
                      ) : (
                        <div className="space-y-1.5">
                          {docs.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-200">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <FileText className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-medium truncate">{doc.file_name}</p>
                                  <p className="text-[10px] text-gray-400">{DOC_TYPE_LABELS[doc.file_type] || doc.file_type} · {doc.uploaded_by_role} · {new Date(doc.created_at).toLocaleDateString("ru-RU")}</p>
                                </div>
                              </div>
                              <a href={doc.file_url} download className="p-1.5 rounded hover:bg-gray-50 flex-shrink-0">
                                <Download className="h-3.5 w-3.5 text-cyan-400" />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
