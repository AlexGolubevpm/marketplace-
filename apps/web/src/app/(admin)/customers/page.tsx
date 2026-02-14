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
import { customerStatuses, customerStatusLabels } from "@cargo/shared";
import { formatDate, formatCurrency } from "@/lib/utils";

const mockCustomers = [
  { id: "c1", telegram_username: "@alexivanov", full_name: "Иванов Алексей", company_name: "ТехноИмпорт", requests_count: 12, orders_count: 8, avg_check: "5200.00", status: "active", created_at: new Date("2025-11-15") },
  { id: "c2", telegram_username: "@petr_cargo", full_name: "Петров Игорь", company_name: "PetrTrade", requests_count: 5, orders_count: 3, avg_check: "8400.00", status: "active", created_at: new Date("2025-12-20") },
  { id: "c3", telegram_username: "@sidorov_p", full_name: "Сидоров Павел", company_name: null, requests_count: 2, orders_count: 1, avg_check: "4800.00", status: "active", created_at: new Date("2026-01-10") },
  { id: "c4", telegram_username: "@kozlov_d", full_name: "Козлов Дмитрий", company_name: "KozTrade", requests_count: 8, orders_count: 5, avg_check: "3100.00", status: "active", created_at: new Date("2025-10-05") },
  { id: "c5", telegram_username: "@aliev_r", full_name: "Алиев Рустам", company_name: "AlievGroup", requests_count: 15, orders_count: 10, avg_check: "6700.00", status: "active", created_at: new Date("2025-09-01") },
  { id: "c6", telegram_username: "@spam_user", full_name: "Тест Тестов", company_name: null, requests_count: 0, orders_count: 0, avg_check: "0", status: "banned", created_at: new Date("2026-02-10") },
];

type CustomerRow = (typeof mockCustomers)[0];

const columns: ColumnDef<CustomerRow>[] = [
  {
    accessorKey: "full_name",
    header: "Имя",
    cell: ({ row }) => (
      <Link href={`/customers/${row.original.id}`} className="text-primary hover:underline font-medium">
        {row.original.full_name || "—"}
      </Link>
    ),
  },
  {
    accessorKey: "telegram_username",
    header: "Telegram",
    cell: ({ row }) => <span className="text-sm">{row.original.telegram_username}</span>,
  },
  {
    accessorKey: "company_name",
    header: "Компания",
    cell: ({ row }) => <span className="text-sm">{row.original.company_name || "—"}</span>,
  },
  {
    accessorKey: "requests_count",
    header: "Заявок",
    cell: ({ row }) => <span>{row.original.requests_count}</span>,
  },
  {
    accessorKey: "orders_count",
    header: "Заказов",
    cell: ({ row }) => <span>{row.original.orders_count}</span>,
  },
  {
    accessorKey: "avg_check",
    header: "Средний чек",
    cell: ({ row }) => (
      <span className="font-medium">
        {parseFloat(row.original.avg_check) > 0 ? formatCurrency(row.original.avg_check) : "—"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Статус",
    cell: ({ row }) => <StatusBadge status={row.original.status} type="customer" />,
  },
  {
    accessorKey: "created_at",
    header: "Регистрация",
    cell: ({ row }) => <span className="text-sm">{formatDate(row.original.created_at)}</span>,
  },
];

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = mockCustomers.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!c.full_name?.toLowerCase().includes(q) && !c.telegram_username.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Клиенты" description="Управление клиентами маркетплейса" />

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Поиск по имени или Telegram..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {customerStatuses.map((s) => (
              <SelectItem key={s} value={s}>{customerStatusLabels[s] || s}</SelectItem>
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
        emptyTitle="Нет клиентов"
        emptyDescription="Клиенты появятся при регистрации через Telegram бота"
      />
    </div>
  );
}
