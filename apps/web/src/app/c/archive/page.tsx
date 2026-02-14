"use client";

import { Package } from "lucide-react";

export default function CustomerArchivePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Архив</h1>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
          <Package className="h-8 w-8 text-white/10" />
        </div>
        <p className="text-white/30 text-lg">Пока пусто</p>
        <p className="text-white/15 text-sm mt-1">Завершённые и отменённые заявки появятся здесь</p>
      </div>
    </div>
  );
}
