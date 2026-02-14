"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Заказы" description="Управление заказами и отслеживание доставки" />
      <EmptyState title="Нет заказов" description="Заказы создаются автоматически при выборе оффера клиентом" />
    </div>
  );
}
