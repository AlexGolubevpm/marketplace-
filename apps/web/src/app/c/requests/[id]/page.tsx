"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Package, Clock, Star, CheckCircle2, Truck, Plane, Anchor, Train, XCircle } from "lucide-react";
import { getRequestById, getOffersByRequest, selectOffer, cancelRequest, type Request, type Offer } from "@/lib/store";

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

export default function CustomerRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<Request | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  const reload = () => {
    const req = getRequestById(params.id as string);
    setRequest(req);
    if (req) {
      const offs = getOffersByRequest(req.id);
      setOffers(offs);
      const sel = offs.find((o) => o.status === "selected");
      if (sel) {
        setSelectedOffer(sel);
        setConfirmed(true);
      }
    }
  };

  useEffect(() => {
    reload();
    const interval = setInterval(reload, 2000);
    return () => clearInterval(interval);
  }, [params.id]);

  if (!request) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const st = statusConfig[request.status] || statusConfig.new;
  const activeOffers = offers.filter((o) => o.status === "active");

  const handleSelect = (offerId: string) => setShowConfirm(offerId);

  const handleConfirm = () => {
    if (!showConfirm) return;
    selectOffer(showConfirm);
    setShowConfirm(null);
    reload();
  };

  const handleCancel = () => {
    cancelRequest(request.id);
    reload();
  };

  return (
    <div className="space-y-6">
      <Link href="/c/requests" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Мои заявки
      </Link>

      {/* Header */}
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
          {request.origin_city}, {request.origin_country}
          <span className="text-white/20">→</span>
          {request.destination_city}, {request.destination_country}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><span className="text-white/30">Груз:</span> <span className="font-medium">{request.cargo_description}</span></div>
          {request.weight_kg && <div><span className="text-white/30">Вес:</span> <span className="font-medium">{parseFloat(request.weight_kg).toLocaleString()} кг</span></div>}
          {request.volume_m3 && <div><span className="text-white/30">Объём:</span> <span className="font-medium">{request.volume_m3} м³</span></div>}
          <div><span className="text-white/30">Доставка:</span> <span className="font-medium">{deliveryLabels[request.delivery_type_preferred] || "Любой"}</span></div>
        </div>
      </div>

      {/* Offers or selected state */}
      {confirmed && selectedOffer ? (
        <>
          <div className="p-5 rounded-2xl border border-green-500/20 bg-green-500/[0.03]">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <h2 className="font-semibold">Оффер выбран</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{selectedOffer.carrier_name}</p>
                <p className="text-sm text-white/40">${selectedOffer.price.toLocaleString()} / {selectedOffer.estimated_days_min}-{selectedOffer.estimated_days_max} дней / {deliveryLabels[selectedOffer.delivery_type]}</p>
              </div>
            </div>
          </div>

          <div className="space-y-0 pl-4">
            {[
              { label: "Оффер выбран", done: true },
              { label: "Груз передан карго", done: false },
              { label: "В пути", done: false },
              { label: "Таможня", done: false },
              { label: "Доставлено", done: false },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex items-start gap-4 pb-5 relative">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${s.done ? "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]" : "bg-white/10"}`} />
                  {i < arr.length - 1 && <div className="w-0.5 flex-1 bg-white/[0.06] mt-1" />}
                </div>
                <span className={`text-sm ${s.done ? "text-white" : "text-white/20"}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </>
      ) : request.status === "cancelled" ? (
        <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/[0.03] text-center">
          <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="font-semibold">Заявка отменена</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              Предложения
              {offers.length > 0 && <span className="text-cyan-400 ml-2">({offers.length})</span>}
            </h2>
            {activeOffers.length >= 2 && (
              <button onClick={() => setCompareMode(!compareMode)} className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                {compareMode ? "Карточки" : "Сравнить"}
              </button>
            )}
          </div>

          {offers.length === 0 && (request.status === "new" || request.status === "matching") && (
            <div className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              </div>
              <p className="text-white/40">Ищем подходящие карго-компании...</p>
              <p className="text-xs text-white/20 mt-1">Обычно первые предложения приходят в течение нескольких минут</p>
            </div>
          )}

          {compareMode && activeOffers.length >= 2 ? (
            <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="text-left py-3 px-4 text-white/30 font-medium">Карго</th>
                  <th className="text-left py-3 px-4 text-white/30 font-medium">Цена</th>
                  <th className="text-left py-3 px-4 text-white/30 font-medium">Срок</th>
                  <th className="text-left py-3 px-4 text-white/30 font-medium">Включено</th>
                  <th className="text-right py-3 px-4"></th>
                </tr></thead>
                <tbody>
                  {activeOffers.map((o) => (
                    <tr key={o.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="py-3 px-4"><div className="font-medium">{o.carrier_name}</div><div className="flex items-center gap-1 text-xs text-white/30"><Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />{o.rating}</div></td>
                      <td className="py-3 px-4 text-lg font-bold">${o.price.toLocaleString()}</td>
                      <td className="py-3 px-4">{o.estimated_days_min}-{o.estimated_days_max} дн</td>
                      <td className="py-3 px-4"><div className="flex flex-wrap gap-1">{o.includes.map((t) => <span key={t} className="px-2 py-0.5 rounded-full bg-white/[0.06] text-xs text-white/40">{t}</span>)}</div></td>
                      <td className="py-3 px-4 text-right"><button onClick={() => handleSelect(o.id)} className="px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 transition-colors">Выбрать</button></td>
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
                          <span className="font-semibold">{offer.carrier_name}</span>
                          <span className="flex items-center gap-1 text-sm text-white/30"><Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />{offer.rating}</span>
                          <span className="text-xs text-white/20">{offer.response_time}</span>
                        </div>
                        <div className="flex items-center gap-6">
                          <div><div className="text-2xl font-bold">${offer.price.toLocaleString()}</div></div>
                          <div className="text-center"><div className="font-semibold">{offer.estimated_days_min}-{offer.estimated_days_max}</div><div className="text-xs text-white/20">дней</div></div>
                          <div className="flex items-center gap-1 text-sm text-white/30"><DIcon className="h-4 w-4" />{deliveryLabels[offer.delivery_type]}</div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {offer.includes.map((tag) => <span key={tag} className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-white/40">{tag}</span>)}
                        </div>
                      </div>
                      <button onClick={() => handleSelect(offer.id)} className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-medium hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all active:scale-[0.98] whitespace-nowrap">Выбрать</button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </>
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md p-8 rounded-2xl border border-white/[0.08] bg-[#12121a]">
            <h3 className="text-xl font-bold mb-2">Подтвердить выбор?</h3>
            {(() => { const o = offers.find((x) => x.id === showConfirm); return o ? (
              <p className="text-sm text-white/40 mb-6">Вы выбираете <strong className="text-white">{o.carrier_name}</strong> за <strong className="text-white">${o.price.toLocaleString()}</strong>. Другие предложения будут отклонены.</p>
            ) : null; })()}
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 font-medium hover:bg-white/5 transition-colors">Отмена</button>
              <button onClick={handleConfirm} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all active:scale-[0.98]">Подтвердить</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
