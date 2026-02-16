"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Package, DollarSign, Send, CheckCircle2, MessageSquare } from "lucide-react";
import { getRequestById, createOffer, getOffersByCarrier, type Request } from "@/lib/store";
import { getSession } from "@/lib/auth";

const inputClass = "w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-colors";

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
    async function load() {
      const req = await getRequestById(params.id as string);
      setRequest(req);
      if (req) {
        const session = getSession("carrier");
        const carrierId = session?.user_id || session?.tg_id || session?.username || "carrier";
        const myOffers = await getOffersByCarrier(carrierId);
        const existing = myOffers.find((o) => o.request_id === req.id);
        if (existing) setAlreadySubmitted(true);
      }
    }
    load();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;
    const session = getSession("carrier");
    const carrierId = session?.user_id || session?.tg_id || session?.username || "carrier";
    const carrierName = session?.name || "Carrier";

    const inc: string[] = [];
    if (includes.pickup) inc.push("Забор груза");
    if (includes.customs) inc.push("Таможня");
    if (includes.door) inc.push("До двери");
    if (includes.insurance) inc.push("Страховка");

    try {
      await createOffer({
        request_id: request.id,
        carrier_id: carrierId,
        carrier_name: carrierName,
        carrier_email: session?.username?.includes("@") ? session.username : undefined,
        price: parseFloat(price),
        estimated_days_min: parseInt(daysMin),
        estimated_days_max: parseInt(daysMax) || parseInt(daysMin) + 3,
        delivery_type: deliveryType,
        conditions: comment,
        includes: inc,
      });
      setSubmitted(true);
    } catch (e) {
      console.error("Failed to create offer:", e);
    }
  };

  if (!request) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/s/requests" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-600 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Назад
      </Link>

      <div className="p-5 rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 text-lg font-bold mb-3">
          <MapPin className="h-5 w-5 text-indigo-400" />
          {request.origin_city}, {request.origin_country} <span className="text-gray-400">→</span> {request.destination_city}, {request.destination_country}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div><span className="text-gray-500">Груз:</span> <span className="font-medium">{request.cargo_description}</span></div>
          {request.weight_kg && <div><span className="text-gray-500">Вес:</span> <span className="font-medium">{parseFloat(request.weight_kg).toLocaleString()} кг</span></div>}
          {request.volume_m3 && <div><span className="text-gray-500">Объём:</span> <span className="font-medium">{request.volume_m3} м³</span></div>}
        </div>
      </div>

      {submitted || alreadySubmitted ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-8 rounded-2xl border border-green-500/20 bg-green-500/[0.03] text-center">
          <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{alreadySubmitted && !submitted ? "Оффер уже отправлен" : "Оффер отправлен"}</h2>
          <p className="text-sm text-gray-400 mb-6">Клиент получит ваше предложение и сможет его выбрать.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={async () => {
              const session = getSession("carrier");
              if (!session || !request) return;
              try {
                await fetch("/api/chats", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ request_id: request.id, customer_id: request.customer_id, carrier_id: session.user_id || session.tg_id }),
                });
                router.push("/s/chats");
              } catch {}
            }} className="px-6 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Написать клиенту
            </button>
            <button onClick={() => router.push("/s/requests")} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">
              Вернуться к заявкам
            </button>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="p-6 rounded-2xl border border-gray-200 bg-white space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><DollarSign className="h-5 w-5 text-indigo-400" /> Ваше предложение</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm text-gray-500 block mb-1">Цена (USD) *</label><input type="number" required placeholder="6200" value={price} onChange={(e) => setPrice(e.target.value)} className={`${inputClass} text-lg font-semibold`} /></div>
              <div><label className="text-sm text-gray-500 block mb-1">Тип доставки</label><select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} className={inputClass}><option value="air">Авиа</option><option value="sea">Море</option><option value="rail">ЖД</option><option value="road">Авто</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm text-gray-500 block mb-1">Срок от (дней) *</label><input type="number" required placeholder="16" value={daysMin} onChange={(e) => setDaysMin(e.target.value)} className={inputClass} /></div>
              <div><label className="text-sm text-gray-500 block mb-1">Срок до (дней)</label><input type="number" placeholder="20" value={daysMax} onChange={(e) => setDaysMax(e.target.value)} className={inputClass} /></div>
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-2">Включено</label>
              <div className="grid grid-cols-2 gap-2">
                {([["pickup", "Забор груза"], ["customs", "Таможня"], ["door", "До двери"], ["insurance", "Страховка"]] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input type="checkbox" checked={includes[key]} onChange={(e) => setIncludes({ ...includes, [key]: e.target.checked })} className="accent-indigo-500" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div><label className="text-sm text-gray-500 block mb-1">Комментарий</label><textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Дополнительные условия..." className={`${inputClass} resize-none`} /></div>
          </div>
          <button type="submit" disabled={!price || !daysMin} className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(99,102,241,0.25)] transition-all active:scale-[0.98]">
            <Send className="h-5 w-5" /> Отправить оффер
          </button>
        </form>
      )}
    </div>
  );
}
