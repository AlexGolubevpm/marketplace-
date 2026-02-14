"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function RequestDetailPage() {
  return (
    <div className="space-y-6">
      <Link href="/requests" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60">
        <ArrowLeft className="h-4 w-4" /> Назад
      </Link>
      <p className="text-white/30 text-center py-20">Детали заявки будут доступны после подключения к БД</p>
    </div>
  );
}
