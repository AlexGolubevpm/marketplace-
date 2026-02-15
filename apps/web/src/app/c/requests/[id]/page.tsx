"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Star, CheckCircle2, Truck, Plane, Anchor, Train, XCircle, Bell, Upload, FileText, Download, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getRequestById, getOffersByRequest, selectOffer, cancelRequest, subscribeToRequest, type Request, type Offer, type Order } from "@/lib/store";

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35 } }),
};

const deliveryIcons: Record<string, any> = { air: Plane, sea: Anchor, rail: Train, road: Truck };
const deliveryLabels: Record<string, string> = { air: "Авиа", sea: "Море", rail: "ЖД", road: "Авто", multimodal: "Мульти" };
const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "Новая", color: "text-blue-400", bg: "bg-blue-500/10" },
  matching: { label: "Ищем карго...", color: "text-indigo-400", bg: "bg-indigo-500/10" },
  offers_received: { label: "Есть офферы", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  offer_selected: { label: "Оффер выбран", color: "text-green-400", bg: "bg-green-500/10" },
  cancelled: { label: "Отменена", color: "text-red-400", bg: "bg-red-500/10" },
};

interface DocFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_by_role: string;
  created_at: string;
}

/* Order status → timeline step mapping */
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
// customs_hold maps same as customs
ORDER_STEP_INDEX["customs_hold"] = ORDER_STEP_INDEX["customs"];
ORDER_STEP_INDEX["payment_pending"] = -1;

export default function CustomerRequestDetailPage() {
  const params = useParams();
  const [request, setRequest] = useState<Request | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [documents, setDocuments] = useState<DocFile[]>([]);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [newOfferAlert, setNewOfferAlert] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const reload = useCallback(async () => {
    try {
      const req = await getRequestById(params.id as string) as any;
      setRequest(req);
      if (req) {
        const offs = req.offers || await getOffersByRequest(req.id);
        setOffers(offs);
        const sel = offs.find((o: Offer) => o.status === "selected");
        if (sel) { setSelectedOffer(sel); setConfirmed(true); }
        if (req.order) setOrder(req.order);
        if (req.documents) setDocuments(req.documents);
      }
    } catch (e) {
      console.error("Failed to load:", e);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    reload();
    const interval = setInterval(reload, 5000);

    // Subscribe to SSE for real-time offer updates
    const unsub = subscribeToRequest(params.id as string, (event) => {
      if (event.type === "offer.received") {
        setNewOfferAlert(true);
        reload();
        setTimeout(() => setNewOfferAlert(false), 3000);
      }
    });

    return () => { clearInterval(interval); unsub(); };
  }, [params.id, reload]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!request) {
    return <div className="text-center py-20 text-white/30">Заявка не найдена</div>;
  }

  const st = statusConfig[request.status] || statusConfig.new;
  const activeOffers = offers.filter((o) => o.status === "active");

  const handleConfirm = async () => {
    if (!showConfirm) return;
    try {
      await selectOffer(showConfirm);
      setShowConfirm(null);
      await reload();
    } catch (e) {
      console.error("Failed to select offer:", e);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelRequest(request.id);
      await reload();
    } catch (e) {
      console.error("Failed to cancel:", e);
    }
  };

  const router = useRouter();
  const getPrice = (o: Offer) => typeof o.price === "string" ? parseFloat(o.price) : o.price;
  const getDays = (o: Offer) => o.estimated_days_min && o.estimated_days_max ? `${o.estimated_days_min}-${o.estimated_days_max}` : String(o.estimated_days || "—");

  const startChat = async (carrierId: string) => {
    if (!request) return;
    const session = getSession();
    if (!session) return;
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: request.id,
          customer_id: session.tg_id,
          carrier_id: carrierId,
        }),
      });
      if (res.ok) {
        router.push("/c/chats");
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* New offer alert */}
      {newOfferAlert && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium flex items-center gap-2">
          <Bell className="h-4 w-4" /> Новое предложение!
        </motion.div>
      )}

      <Link href="/c/requests" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Мои заявки
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{request.display_id}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${st.color} ${st.bg}`}>{st.label}</span>
          </div>
          <p className="text-sm text-white/30 mt-1">{new Date(request.created_at).toLocaleString("ru-RU")}</p>
        </div>
        {!confirmed && request.status !== "cancelled" && (
          <button onClick={handleCancel} className="px-4 py-2 rounded-lg border border-red-500/20 text-red-400 text-sm hover:bg-red-500/10 transition-colors">
            <XCircle className="h-4 w-4 inline mr-1" /> Отменить
          </button>
        )}
      </div>

      {/* Route + cargo */}
      <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2 text-lg font-semibold mb-3">
          <MapPin className="h-5 w-5 text-cyan-400" />
          {request.origin_city}, {request.origin_country} <span className="text-white/20">→</span> {request.destination_city}, {request.destination_country}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><span className="text-white/30">Груз:</span> <span className="font-medium">{request.cargo_description}</span></div>
          {request.weight_kg && <div><span className="text-white/30">Вес:</span> <span className="font-medium">{parseFloat(request.weight_kg).toLocaleString()} кг</span></div>}
          {request.volume_m3 && <div><span className="text-white/30">Объём:</span> <span className="font-medium">{request.volume_m3} м³</span></div>}
          <div><span className="text-white/30">Доставка:</span> <span className="font-medium">{deliveryLabels[request.delivery_type_preferred || ""] || "Любой"}</span></div>
        </div>
      </div>

      {/* Offers or selected state */}
      {confirmed && selectedOffer ? (
        <>
          <div className="p-5 rounded-2xl border border-green-500/20 bg-green-500/[0.03]">
            <div className="flex items-center gap-2 mb-3"><CheckCircle2 className="h-5 w-5 text-green-400" /><h2 className="font-semibold">Оффер выбран</h2></div>
            <p className="font-semibold">{selectedOffer.carrier_name || "Карго"}</p>
            <p className="text-sm text-white/40">${getPrice(selectedOffer).toLocaleString()} / {getDays(selectedOffer)} дней / {deliveryLabels[selectedOffer.delivery_type]}</p>
          </div>
          {/* Dynamic timeline based on order status */}
          <div className="space-y-0 pl-4">
            {(() => {
              const currentStep = order ? (ORDER_STEP_INDEX[order.status] ?? -1) : 0;
              return ORDER_TIMELINE.map((s, i, arr) => {
                const done = i <= currentStep;
                const isCurrent = i === currentStep;
                return (
                  <div key={s.key} className="flex items-start gap-4 pb-5">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${done ? "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]" : "bg-white/10"} ${isCurrent ? "ring-2 ring-cyan-400/30" : ""}`} />
                      {i < arr.length - 1 && <div className={`w-0.5 flex-1 mt-1 ${done && i < currentStep ? "bg-cyan-400/30" : "bg-white/[0.06]"}`} />}
                    </div>
                    <span className={`text-sm ${done ? "text-white" : "text-white/20"} ${isCurrent ? "font-semibold" : ""}`}>{s.label}</span>
                  </div>
                );
              });
            })()}
          </div>

          {/* Order tracking info */}
          {order?.tracking_number && (
            <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-sm text-white/30 mb-1">Трек-номер</p>
              <p className="font-mono font-medium">{order.tracking_number}</p>
            </div>
          )}

          {/* Documents section */}
          <DocumentsSection orderId={order?.id} documents={documents} onUpload={reload} uploading={uploading} setUploading={setUploading} role="customer" />
        </>
      ) : request.status === "cancelled" ? (
        <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/[0.03] text-center">
          <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" /><p className="font-semibold">Заявка отменена</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Предложения {offers.length > 0 && <span className="text-cyan-400 ml-1">({offers.length})</span>}</h2>
            {activeOffers.length >= 2 && (
              <button onClick={() => setCompareMode(!compareMode)} className="text-sm text-cyan-400 hover:text-cyan-300">{compareMode ? "Карточки" : "Сравнить"}</button>
            )}
          </div>

          {offers.length === 0 ? (
            <div className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              </div>
              <p className="text-white/40">Ищем подходящие карго-компании...</p>
              <p className="text-xs text-white/20 mt-1">Первые предложения обычно приходят в течение нескольких минут</p>
            </div>
          ) : compareMode ? (
            <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="text-left py-3 px-4 text-white/30 font-medium">Карго</th>
                  <th className="text-left py-3 px-4 text-white/30 font-medium">Цена</th>
                  <th className="text-left py-3 px-4 text-white/30 font-medium">Срок</th>
                  <th className="text-left py-3 px-4 text-white/30 font-medium">Тип</th>
                  <th className="text-right py-3 px-4"></th>
                </tr></thead>
                <tbody>
                  {activeOffers.map((o) => (
                    <tr key={o.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-medium">{o.carrier_name || "Карго"}</td>
                      <td className="py-3 px-4 text-lg font-bold">${getPrice(o).toLocaleString()}</td>
                      <td className="py-3 px-4">{getDays(o)} дн</td>
                      <td className="py-3 px-4">{deliveryLabels[o.delivery_type] || o.delivery_type}</td>
                      <td className="py-3 px-4 text-right flex gap-2 justify-end">
                        <button onClick={() => startChat(o.carrier_id)} className="px-3 py-2 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-gray-50"><MessageSquare className="h-3.5 w-3.5 inline mr-1" />Чат</button>
                        <button onClick={() => setShowConfirm(o.id)} className="px-4 py-2 rounded-lg bg-red-50 text-red-500 text-sm font-medium hover:bg-red-100">Выбрать</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <motion.div initial="hidden" animate="visible" className="space-y-3">
              {activeOffers.map((offer, i) => {
                const DIcon = deliveryIcons[offer.delivery_type] || Truck;
                return (
                  <motion.div key={offer.id} variants={fadeUp} custom={i} className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{offer.carrier_name || "Карго"}</span>
                          {offer.rating && <span className="flex items-center gap-1 text-sm text-white/30"><Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />{offer.rating}</span>}
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-2xl font-bold">${getPrice(offer).toLocaleString()}</div>
                          <div className="text-center"><div className="font-semibold">{getDays(offer)}</div><div className="text-xs text-white/20">дней</div></div>
                          <div className="flex items-center gap-1 text-sm text-white/30"><DIcon className="h-4 w-4" />{deliveryLabels[offer.delivery_type]}</div>
                        </div>
                        {offer.includes && offer.includes.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {offer.includes.map((tag) => <span key={tag} className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-white/40">{tag}</span>)}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startChat(offer.carrier_id)} className="px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all active:scale-[0.98] whitespace-nowrap"><MessageSquare className="h-4 w-4 inline mr-1" />Написать</button>
                        <button onClick={() => setShowConfirm(offer.id)} className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-medium hover:shadow-lg transition-all active:scale-[0.98] whitespace-nowrap">Выбрать</button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </>
      )}

      {/* Documents section for non-order state */}
      {!confirmed && !selectedOffer && order && (
        <DocumentsSection orderId={order?.id} documents={documents} onUpload={reload} uploading={uploading} setUploading={setUploading} role="customer" />
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md p-8 rounded-2xl border border-white/[0.08] bg-[#12121a]">
            <h3 className="text-xl font-bold mb-2">Подтвердить выбор?</h3>
            {(() => { const o = offers.find((x) => x.id === showConfirm); return o ? (
              <p className="text-sm text-white/40 mb-6">Вы выбираете <strong className="text-white">{o.carrier_name || "Карго"}</strong> за <strong className="text-white">${getPrice(o).toLocaleString()}</strong>. Другие предложения будут отклонены.</p>
            ) : null; })()}
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 font-medium hover:bg-white/5">Отмена</button>
              <button onClick={handleConfirm} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold active:scale-[0.98]">Подтвердить</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ── Documents Section ── */
const DOC_TYPE_LABELS: Record<string, string> = {
  invoice: "Инвойс",
  customs_declaration: "Таможенная декларация",
  bill_of_lading: "Коносамент",
  photo: "Фото",
  contract: "Договор",
  other: "Другое",
};

function DocumentsSection({ orderId, documents, onUpload, uploading, setUploading, role }: {
  orderId?: string;
  documents: DocFile[];
  onUpload: () => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
  role: string;
}) {
  if (!orderId) return null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Upload file
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      // Save document record
      await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          file_name: file.name,
          file_url: url,
          file_type: "other",
          uploaded_by_role: role,
        }),
      });
      onUpload();
    } catch (err) {
      console.error("Upload error:", err);
    }
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-cyan-400" />
          <h2 className="font-semibold">Документы</h2>
          {documents.length > 0 && <span className="text-white/30 text-sm">({documents.length})</span>}
        </div>
        <label className={`px-4 py-2 rounded-lg border border-white/10 text-sm font-medium cursor-pointer hover:bg-white/5 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          <Upload className="h-4 w-4 inline mr-1.5" />
          {uploading ? "Загрузка..." : "Загрузить"}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
      {documents.length === 0 ? (
        <p className="text-sm text-white/20">Нет загруженных документов</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-4 w-4 text-white/30 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{doc.file_name}</p>
                  <p className="text-xs text-white/20">{DOC_TYPE_LABELS[doc.file_type] || doc.file_type} · {new Date(doc.created_at).toLocaleDateString("ru-RU")}</p>
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
  );
}
