"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Клиенты" description="Управление клиентами маркетплейса" />
      <EmptyState title="Нет клиентов" description="Клиенты появятся при регистрации через Telegram или веб" />
    </div>
  );
}
