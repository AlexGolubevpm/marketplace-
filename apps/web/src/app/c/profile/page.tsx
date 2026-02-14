"use client";

import { User, Mail, Phone, Building, Save } from "lucide-react";

export default function CustomerProfilePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Профиль</h1>

      <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/20 flex items-center justify-center">
            <User className="h-7 w-7 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Иванов Алексей</h2>
            <p className="text-sm text-white/30">@alexivanov</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/30 block mb-1">Имя</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input defaultValue="Иванов Алексей" className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-cyan-500/40 transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-sm text-white/30 block mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input defaultValue="alex@technoimport.ru" className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-cyan-500/40 transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-sm text-white/30 block mb-1">Телефон</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input defaultValue="+7 916 123-45-67" className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-cyan-500/40 transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-sm text-white/30 block mb-1">Компания</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input defaultValue="ТехноИмпорт" className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-cyan-500/40 transition-colors" />
            </div>
          </div>
        </div>

        <button className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all active:scale-[0.98]">
          <Save className="h-4 w-4" />
          Сохранить
        </button>
      </div>
    </div>
  );
}
