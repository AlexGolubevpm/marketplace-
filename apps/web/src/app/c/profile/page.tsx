"use client";

import { useEffect, useState } from "react";
import { User, Mail, Phone, Building, Save, CheckCircle2 } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getRequests } from "@/lib/store";

export default function CustomerProfilePage() {
  const [session, setSession] = useState<any>(null);
  const [stats, setStats] = useState({ requests: 0, orders: 0 });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = getSession();
    setSession(s);
    if (s) {
      const userId = s.tg_id || s.username || "anonymous";
      getRequests(userId).then((reqs) => {
        setStats({ requests: reqs.length, orders: 0 });
      }).catch(() => {});
    }
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!session) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Профиль</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
          <div className="text-2xl font-bold">{stats.requests}</div>
          <div className="text-xs text-white/30 mt-1">Заявок создано</div>
        </div>
        <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
          <div className="text-2xl font-bold">{stats.orders}</div>
          <div className="text-xs text-white/30 mt-1">Заказов</div>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-4">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/20 flex items-center justify-center">
            <User className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{session.name || "Пользователь"}</h2>
            {session.username && <p className="text-sm text-white/30">{session.username}</p>}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-white/30 block mb-1">Имя</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input defaultValue={session.name || ""} className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-cyan-500/40 transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-sm text-white/30 block mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input defaultValue={session.username?.includes("@") ? session.username : ""} className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-cyan-500/40 transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-sm text-white/30 block mb-1">Телефон</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input placeholder="+7 ..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-sm text-white/30 block mb-1">Компания</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input placeholder="Название компании" className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 transition-colors" />
            </div>
          </div>
        </div>

        <button onClick={handleSave} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all active:scale-[0.98]">
          {saved ? <><CheckCircle2 className="h-4 w-4" /> Сохранено</> : <><Save className="h-4 w-4" /> Сохранить</>}
        </button>
      </div>
    </div>
  );
}
