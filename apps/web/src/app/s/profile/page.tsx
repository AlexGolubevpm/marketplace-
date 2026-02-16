"use client";

import { Building, User, Phone, Mail, Globe, MapPin, Truck, Clock, Trophy, Save } from "lucide-react";

export default function CarrierProfilePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Профиль компании</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-gray-200 bg-white text-center">
          <Clock className="h-5 w-5 text-indigo-400 mx-auto mb-2" />
          <div className="text-2xl font-bold">45 мин</div>
          <div className="text-xs text-gray-500 mt-1">Ср. время ответа</div>
        </div>
        <div className="p-4 rounded-2xl border border-gray-200 bg-white text-center">
          <Trophy className="h-5 w-5 text-yellow-500 mx-auto mb-2" />
          <div className="text-2xl font-bold">62</div>
          <div className="text-xs text-gray-500 mt-1">Выбранных офферов</div>
        </div>
        <div className="p-4 rounded-2xl border border-gray-200 bg-white text-center">
          <Truck className="h-5 w-5 text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold">180</div>
          <div className="text-xs text-gray-500 mt-1">Отправлено офферов</div>
        </div>
      </div>

      {/* Profile form */}
      <div className="p-6 rounded-2xl border border-gray-200 bg-white space-y-5">
        <h2 className="font-semibold text-lg">Данные компании</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500 block mb-1">Название компании</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input defaultValue="SilkWay Express" className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-red-300 transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">Контактное лицо</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input defaultValue="Ли Вэй" className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-red-300 transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">Телефон</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input defaultValue="+86 186 1234 5678" className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-red-300 transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input defaultValue="liwei@silkway.com" className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-red-300 transition-colors" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-500 block mb-1">Описание</label>
          <textarea rows={3} defaultValue="Крупная карго-компания с фокусом на авиаперевозках из Китая в страны СНГ. Работает с 2018 года." className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-red-300 transition-colors resize-none" />
        </div>
      </div>

      {/* Regions */}
      <div className="p-6 rounded-2xl border border-gray-200 bg-white space-y-4">
        <h2 className="font-semibold text-lg flex items-center gap-2"><Globe className="h-5 w-5 text-indigo-400" /> Города работы</h2>
        <div className="flex flex-wrap gap-2">
          {["CN → RU", "CN → KZ", "CN → UZ", "CN → KG"].map((r) => (
            <span key={r} className="px-4 py-2 rounded-xl bg-gray-100 border border-gray-200 text-sm">
              <MapPin className="h-3.5 w-3.5 inline mr-1 text-indigo-400" />{r}
            </span>
          ))}
          <button className="px-4 py-2 rounded-xl border border-dashed border-gray-200 text-sm text-gray-400 hover:text-gray-500 hover:border-gray-300 transition-colors">
            + Добавить
          </button>
        </div>
      </div>

      {/* Delivery types */}
      <div className="p-6 rounded-2xl border border-gray-200 bg-white space-y-4">
        <h2 className="font-semibold text-lg flex items-center gap-2"><Truck className="h-5 w-5 text-indigo-400" /> Типы доставки</h2>
        <div className="flex flex-wrap gap-2">
          {["Авиа", "Мультимодальный"].map((t) => (
            <span key={t} className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm text-indigo-400">
              {t}
            </span>
          ))}
        </div>
      </div>

      <button className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_25px_rgba(99,102,241,0.2)] transition-all active:scale-[0.98]">
        <Save className="h-4 w-4" />
        Сохранить изменения
      </button>
    </div>
  );
}
