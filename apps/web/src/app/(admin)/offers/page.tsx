"use client";

import { useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { offerStatuses, offerStatusLabels, deliveryTypeLabels } from "@cargo/shared";
import { formatDate, formatCurrency } from "@/lib/utils";

const mockOffers = [
  { id: "o1", display_id: "OFF-2026-0203", request_display_id: "REQ-2026-0142", carrier_name: "FastCargo", price: "6200.00", estimated_days: 18, delivery_type: "sea", status: "active", created_at: new Date("2026-02-14T11:15:00") },
  { id: "o2", display_id: "OFF-2026-0202", request_display_id: "REQ-2026-0142", carrier_name: "SilkWay Express", price: "8500.00", estimated_days: 7, delivery_type: "air", status: "active", created_at: new Date("2026-02-14T11:30:00") },
  { id: "o3", display_id: "OFF-2026-0201", request_display_id: "REQ-2026-0142", carrier_name: "RailBridge", price: "5800.00", estimated_days: 22, delivery_type: "rail", status: "active", created_at: new Date("2026-02-14T12:00:00") },
  { id: "o4", display_id: "OFF-2026-0200", request_display_id: "REQ-2026-0139", carrier_name: "GlobalFreight", price: "3200.00", estimated_days: 25, delivery_type: "sea", status: "selected", created_at: new Date("2026-02-13T13:00:00") },
  { id: "o5", display_id: "OFF-2026-0199", request_display_id: "REQ-2026-0139", carrier_name: "ChinaRoad", price: "1200.00", estimated_days: 15, delivery_type: "road", status: "suspicious", created_at: new Date("2026-02-13T14:00:00") },
  { id: "o6", display_id: "OFF-2026-0198", request_display_id: "REQ-2026-0138", carrier_name: "FastCargo", price: "7100.00", estimated_days: 20, delivery_type: "sea", status: "expired", created_at: new Date("2026-02-12T09:00:00") },
];

type OfferRow = (typeof mockOffers)[0];

const columns: ColumnDef<OfferRow>[] = [
  {
    accessorKey: "display_id",
    header: "ID",
    cell: ({ row }) => (
      <span className="font-medium text-sm">{row.original.display_id}</span>
    ),
  },
  {
    accessorKey: "request_display_id",
    header: "Заявка",
    cell: ({ row }) => (
      <Link href="/requests/1" className="text-primary hover:underline text-sm">
        {row.original.request_display_id}
      </Link>
    ),
  },
  {
    accessorKey: "carrier_name",
    header: "Карго",
    cell: ({ row }) => (
      <Link href="/carriers" className="hover:text-primary text-sm">
        {row.original.carrier_name}
      </Link>
    ),
  },
  {
    accessorKey: "price",
    header: "Цена",
    cell: ({ row }) => (
      <span className={`font-semibold ${row.original.status === "suspicious" ? "text-orange-600" : ""}`}>
        {formatCurrency(row.original.price)}
      </span>
    ),
  },
  {
    accessorKey: "estimated_days",
    header: "Срок",
    cell: ({ row }) => <span>{row.original.estimated_days} дней</span>,
  },
  {
    accessorKey: "delivery_type",
    header: "Тип",
    cell: ({ row }) => (
      <Badge variant="outline">
        {deliveryTypeLabels[row.original.delivery_type] || row.original.delivery_type}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Статус",
    cell: ({ row }) => <StatusBadge status={row.original.status} type="offer" />,
  },
  {
    accessorKey: "created_at",
    header: "Дата",
    cell: ({ row }) => <span className="text-sm">{formatDate(row.original.created_at)}</span>,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <EyeOff className="h-4 w-4 mr-2" /> Скрыть
          </DropdownMenuItem>
          <DropdownMenuItem>
            <AlertTriangle className="h-4 w-4 mr-2" /> Пометить подозрительным
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export default function OffersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = mockOffers.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search && !o.display_id.toLowerCase().includes(search.toLowerCase()) && !o.carrier_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Офферы" description="Управление предложениями карго" />

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Поиск по ID или карго..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {offerStatuses.map((s) => (
              <SelectItem key={s} value={s}>{offerStatusLabels[s] || s}</SelectItem>
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
        emptyTitle="Нет офферов"
        emptyDescription="Офферы появятся когда карго ответят на заявки"
      />
    </div>
  );
}
