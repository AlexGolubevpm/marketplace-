"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function OffersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Офферы" description="Управление предложениями карго" />
      <EmptyState title="Нет офферов" description="Офферы появятся когда карго ответят на заявки" />
    </div>
  );
}
