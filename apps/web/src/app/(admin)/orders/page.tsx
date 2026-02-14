"use client";

import { useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { orderStatuses, orderStatusLabels } from "@cargo/shared";
import { formatDate, formatCurrency } from "@/lib/utils";

const mockOrders = [
  { id: "1", display_id: "ORD-2026-0089", route: "CN, Шэньчжэнь → RU, Екатеринбург", customer_name: "Иванов А.", carrier_name: "GlobalFreight", price: "3200.00", status: "in_transit", tracking_number: "GF-2026-1234", created_at: new Date("2026-02-13T14:00:00"), updated_at: new Date("2026-02-14T08:00:00") },
  { id: "2", display_id: "ORD-2026-0088", route: "CN, Гуанчжоу → RU, Москва", customer_name: "Петров И.", carrier_name: "FastCargo", price: "6500.00", status: "customs", tracking_number: "FC-2026-5678", created_at: new Date("2026-02-10T10:00:00"), updated_at: new Date("2026-02-14T06:00:00") },
  { id: "3", display_id: "ORD-2026-0087", route: "TR, Стамбул → KZ, Алматы", customer_name: "Сидоров П.", carrier_name: "SilkWay Express", price: "4800.00", status: "delivered", tracking_number: "SW-2026-9012", created_at: new Date("2026-02-05T09:00:00"), updated_at: new Date("2026-02-13T15:00:00") },
  { id: "4", display_id: "ORD-2026-0086", route: "CN, Иу → RU, Владивосток", customer_name: "Козлов Д.", carrier_name: "RailBridge", price: "2100.00", status: "awaiting_shipment", tracking_number: null, created_at: new Date("2026-02-12T11:00:00"), updated_at: new Date("2026-02-12T11:00:00") },
  { id: "5", display_id: "ORD-2026-0085", route: "CN, Гуанчжоу → UZ, Ташкент", customer_name: "Алиев Р.", carrier_name: "ChinaRoad", price: "5600.00", status: "completed", tracking_number: "CR-2026-3456", created_at: new Date("2026-01-28T08:00:00"), updated_at: new Date("2026-02-10T12:00:00") },
];

type OrderRow = (typeof mockOrders)[0];

const columns: ColumnDef<OrderRow>[] = [
  {
    accessorKey: "display_id",
    header: "ID",
    cell: ({ row }) => (
      <Link href={`/orders/${row.original.id}`} className="text-primary hover:underline font-medium">
        {row.original.display_id}
      </Link>
    ),
  },
  {
    accessorKey: "route",
    header: "Маршрут",
    cell: ({ row }) => <span className="text-sm">{row.original.route}</span>,
  },
  {
    accessorKey: "customer_name",
    header: "Клиент",
    cell: ({ row }) => <span className="text-sm">{row.original.customer_name}</span>,
  },
  {
    accessorKey: "carrier_name",
    header: "Карго",
    cell: ({ row }) => <span className="text-sm">{row.original.carrier_name}</span>,
  },
  {
    accessorKey: "price",
    header: "Цена",
    cell: ({ row }) => <span className="font-semibold">{formatCurrency(row.original.price)}</span>,
  },
  {
    accessorKey: "status",
    header: "Статус",
    cell: ({ row }) => <StatusBadge status={row.original.status} type="order" />,
  },
  {
    accessorKey: "tracking_number",
    header: "Трекинг",
    cell: ({ row }) => (
      <span className="text-sm font-mono">
        {row.original.tracking_number || "—"}
      </span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Создан",
    cell: ({ row }) => <span className="text-sm">{formatDate(row.original.created_at)}</span>,
  },
];

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = mockOrders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search && !o.display_id.toLowerCase().includes(search.toLowerCase()) && !o.tracking_number?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Заказы" description="Управление заказами и отслеживание доставки" />

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Поиск по ID или трекингу..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {orderStatuses.map((s) => (
              <SelectItem key={s} value={s}>{orderStatusLabels[s] || s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        total={filtered.length}
        page={page}
        pageSize={20}
        onPageChange={setPage}
        emptyTitle="Нет заказов"
        emptyDescription="Заказы создаются автоматически при выборе оффера"
      />
    </div>
  );
}
