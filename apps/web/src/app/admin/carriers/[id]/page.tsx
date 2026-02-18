"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CarrierDetailPage() {
  return (
    <div className="space-y-6">
      <Link href="/carriers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-600">
        <ArrowLeft className="h-4 w-4" /> Назад
      </Link>
      <p className="text-gray-500 text-center py-20">Профиль карго будет доступен после подключения к БД</p>
    </div>
  );
}
