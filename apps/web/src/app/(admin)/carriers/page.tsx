"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function CarriersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Карго" description="Управление логистическими компаниями" />
      <EmptyState title="Нет карго-компаний" description="Добавьте первую логистическую компанию" />
    </div>
  );
}
