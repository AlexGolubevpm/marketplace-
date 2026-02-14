"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Package, DollarSign, Send, CheckCircle2 } from "lucide-react";
import { getRequestById, createOffer, getOffersByRequest, type Request } from "@/lib/store";
import { getSession } from "@/lib/auth";

const inputClass = "w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 transition-colors";

export default function CarrierOfferPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<Request | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [price, setPrice] = useState("");
  const [daysMin, setDaysMin] = useState("");
  const [daysMax, setDaysMax] = useState("");
  const [deliveryType, setDeliveryType] = useState("sea");
  const [comment, setComment] = useState("");
  const [includes, setIncludes] = useState({ pickup: false, customs: false, door: false, insurance: false });

  useEffect(() => {
    const req = getRequestById(params.id as string);
    setRequest(req);
    if (req) {
      const session = getSession();
      const carrierId = session?.tg_id || session?.username || "carrier";
      const existing = getOffersByRequest(req.id).find((o) => o.carrier_id === carrierId);
      if (existing) setAlreadySubmitted(true);
    }
  }, [params.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;
    const session = getSession();
    const carrierId = session?.tg_id || session?.username || "carrier";
    const carrierName = session?.name || "Carrier";

    const inc: string[] = [];
    if (includes.pickup) inc.push("Забор груза");
    if (includes.customs) inc.push("Таможня");
    if (includes.door) inc.push("До двери");
    if (includes.insurance) inc.push("Страховка");

    createOffer({
      request_id: request.id,
      carrier_id: carrierId,
      carrier_name: carrierName,
      price: parseFloat(price),
      estimated_days_min: parseInt(daysMin),
      estimated_days_max: parseInt(daysMax) || parseInt(daysMin) + 3,
      delivery_type: deliveryType,
      conditions: comment,
      includes: inc,
    });

    setSubmitted(true);
  };

  if (!request) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/s/requests" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Назад
      </Link>

      <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2 text-lg font-bold mb-3">
          <MapPin className="h-5 w-5 text-indigo-400" />
          {request.origin_city}, {request.origin_country} <span className="text-white/20">→</span> {request.destination_city}, {request.destination_country}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div><span className="text-white/30">Груз:</span> <span className="font-medium">{request.cargo_description}</span></div>
          {request.weight_kg && <div><span className="text-white/30">Вес:</span> <span className="font-medium">{parseFloat(request.weight_kg).toLocaleString()} кг</span></div>}
          {request.volume_m3 && <div><span className="text-white/30">Объём:</span> <span className="font-medium">{request.volume_m3} м³</span></div>}
        </div>
      </div>

      {submitted || alreadySubmitted ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-8 rounded-2xl border border-green-500/20 bg-green-500/[0.03] text-center">
          <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{alreadySubmitted && !submitted ? "Оффер уже отправлен" : "Оффер отправлен"}</h2>
          <p className="text-sm text-white/40 mb-6">Клиент получит ваше предложение и сможет его выбрать.</p>
          <button onClick={() => router.push("/s/requests")} className="px-6 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors">
            Вернуться к заявкам
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><DollarSign className="h-5 w-5 text-indigo-400" /> Ваше предложение</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm text-white/30 block mb-1">Цена (USD) *</label><input type="number" required placeholder="6200" value={price} onChange={(e) => setPrice(e.target.value)} className={`${inputClass} text-lg font-semibold`} /></div>
              <div><label className="text-sm text-white/30 block mb-1">Тип доставки</label><select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} className={inputClass}><option value="air">Авиа</option><option value="sea">Море</option><option value="rail">ЖД</option><option value="road">Авто</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm text-white/30 block mb-1">Срок от (дней) *</label><input type="number" required placeholder="16" value={daysMin} onChange={(e) => setDaysMin(e.target.value)} className={inputClass} /></div>
              <div><label className="text-sm text-white/30 block mb-1">Срок до (дней)</label><input type="number" placeholder="20" value={daysMax} onChange={(e) => setDaysMax(e.target.value)} className={inputClass} /></div>
            </div>
            <div>
              <label className="text-sm text-white/30 block mb-2">Включено</label>
              <div className="grid grid-cols-2 gap-2">
                {([["pickup", "Забор груза"], ["customs", "Таможня"], ["door", "До двери"], ["insurance", "Страховка"]] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.04] transition-colors">
                    <input type="checkbox" checked={includes[key]} onChange={(e) => setIncludes({ ...includes, [key]: e.target.checked })} className="accent-indigo-500" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div><label className="text-sm text-white/30 block mb-1">Комментарий</label><textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Дополнительные условия..." className={`${inputClass} resize-none`} /></div>
          </div>
          <button type="submit" disabled={!price || !daysMin} className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(99,102,241,0.25)] transition-all active:scale-[0.98]">
            <Send className="h-5 w-5" /> Отправить оффер
          </button>
        </form>
      )}
    </div>
  );
}
