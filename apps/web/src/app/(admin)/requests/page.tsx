"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function RequestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Заявки" description="Управление заявками на доставку" />
      <EmptyState
        title="Нет заявок"
        description="Заявки от клиентов появятся здесь после подключения к базе данных"
      />
    </div>
  );
}
