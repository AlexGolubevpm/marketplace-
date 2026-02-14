"use client";

import { PageHeader } from "@/components/page-header";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Аналитика" description="Метрики и аналитические отчёты" />
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
          <BarChart3 className="h-8 w-8 text-white/10" />
        </div>
        <p className="text-white/30 text-lg">Аналитика</p>
        <p className="text-white/15 text-sm mt-1">Данные для аналитики появятся после начала работы платформы</p>
      </div>
    </div>
  );
}
