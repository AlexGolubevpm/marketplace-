"use client";

import { useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Filter } from "lucide-react";
import { requestStatuses, requestSources, requestStatusLabels } from "@cargo/shared";
import { formatDate, formatCurrency } from "@/lib/utils";

// Mock data
const mockRequests = [
  {
    id: "1",
    display_id: "REQ-2026-0142",
    origin_country: "CN",
    origin_city: "Гуанчжоу",
    destination_country: "RU",
    destination_city: "Москва",
    weight_kg: "1500.00",
    created_at: new Date("2026-02-14T10:30:00"),
    status: "offers_received",
    offer_count: 3,
    first_offer_at: new Date("2026-02-14T11:15:00"),
    sla_violated: false,
    source: "telegram_bot",
  },
  {
    id: "2",
    display_id: "REQ-2026-0141",
    origin_country: "CN",
    origin_city: "Иу",
    destination_country: "KZ",
    destination_city: "Алматы",
    weight_kg: "800.00",
    created_at: new Date("2026-02-14T09:00:00"),
    status: "matching",
    offer_count: 0,
    first_offer_at: null,
    sla_violated: false,
    source: "web_form",
  },
  {
    id: "3",
    display_id: "REQ-2026-0140",
    origin_country: "TR",
    origin_city: "Стамбул",
    destination_country: "RU",
    destination_city: "Новосибирск",
    weight_kg: "2300.50",
    created_at: new Date("2026-02-13T15:00:00"),
    status: "new",
    offer_count: 0,
    first_offer_at: null,
    sla_violated: true,
    source: "admin_manual",
  },
  {
    id: "4",
    display_id: "REQ-2026-0139",
    origin_country: "CN",
    origin_city: "Шэньчжэнь",
    destination_country: "RU",
    destination_city: "Екатеринбург",
    weight_kg: "450.00",
    created_at: new Date("2026-02-13T12:00:00"),
    status: "offer_selected",
    offer_count: 5,
    first_offer_at: new Date("2026-02-13T12:45:00"),
    sla_violated: false,
    source: "telegram_bot",
  },
  {
    id: "5",
    display_id: "REQ-2026-0138",
    origin_country: "CN",
    origin_city: "Гуанчжоу",
    destination_country: "UZ",
    destination_city: "Ташкент",
    weight_kg: "3200.00",
    created_at: new Date("2026-02-12T08:00:00"),
    status: "expired",
    offer_count: 1,
    first_offer_at: new Date("2026-02-12T14:30:00"),
    sla_violated: true,
    source: "api",
  },
];

type RequestRow = (typeof mockRequests)[0];

const columns: ColumnDef<RequestRow>[] = [
  {
    accessorKey: "display_id",
    header: "ID",
    cell: ({ row }) => (
      <Link href={`/requests/${row.original.id}`} className="text-primary hover:underline font-medium">
        {row.original.display_id}
      </Link>
    ),
  },
  {
    id: "route",
    header: "Маршрут",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.origin_country}, {row.original.origin_city} → {row.original.destination_country}, {row.original.destination_city}
      </span>
    ),
  },
  {
    accessorKey: "weight_kg",
    header: "Вес",
    cell: ({ row }) => (
      <span>{row.original.weight_kg ? `${parseFloat(row.original.weight_kg).toLocaleString()} кг` : "—"}</span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Дата",
    cell: ({ row }) => <span className="text-sm">{formatDate(row.original.created_at)}</span>,
  },
  {
    accessorKey: "status",
    header: "Статус",
    cell: ({ row }) => <StatusBadge status={row.original.status} type="request" />,
  },
  {
    accessorKey: "offer_count",
    header: "Офферы",
    cell: ({ row }) => {
      const count = row.original.offer_count;
      return (
        <Badge variant={count >= 3 ? "success" : count > 0 ? "warning" : "gray"}>
          {count}
        </Badge>
      );
    },
  },
  {
    id: "sla",
    header: "SLA",
    cell: ({ row }) => (
      <span className={`text-lg ${row.original.sla_violated ? "text-red-500" : "text-green-500"}`}>
        {row.original.sla_violated ? "●" : "●"}
      </span>
    ),
  },
];

export default function RequestsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const filtered = mockRequests.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search && !r.display_id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Заявки" description="Управление заявками на доставку">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Новая заявка
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {requestStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {requestStatusLabels[s] || s}
              </SelectItem>
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
        emptyTitle="Нет заявок"
        emptyDescription="Создайте первую заявку или измените фильтры"
      />
    </div>
  );
}
