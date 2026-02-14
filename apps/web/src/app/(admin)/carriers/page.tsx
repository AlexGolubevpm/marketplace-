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
import { Plus, Search } from "lucide-react";
import { carrierStatuses, carrierStatusLabels } from "@cargo/shared";
import { formatMinutesToDuration } from "@/lib/utils";

const mockCarriers = [
  { id: "c1", name: "FastCargo", regions: ["CN→RU", "CN→KZ"], delivery_types: ["sea", "air"], avg_response_time_minutes: 85, total_requests_received: 142, total_offers_won: 38, total_offers_made: 98, sla_rating: "0.87", status: "active" },
  { id: "c2", name: "SilkWay Express", regions: ["CN→RU", "CN→UZ", "CN→KG"], delivery_types: ["air", "multimodal"], avg_response_time_minutes: 45, total_requests_received: 210, total_offers_won: 62, total_offers_made: 180, sla_rating: "0.95", status: "active" },
  { id: "c3", name: "RailBridge", regions: ["CN→RU", "CN→KZ"], delivery_types: ["rail"], avg_response_time_minutes: 120, total_requests_received: 95, total_offers_won: 28, total_offers_made: 72, sla_rating: "0.78", status: "active" },
  { id: "c4", name: "ChinaRoad", regions: ["CN→RU"], delivery_types: ["road", "multimodal"], avg_response_time_minutes: 200, total_requests_received: 60, total_offers_won: 8, total_offers_made: 35, sla_rating: "0.52", status: "suspended" },
  { id: "c5", name: "GlobalFreight", regions: ["CN→RU", "TR→RU", "EU→RU"], delivery_types: ["sea", "air", "rail"], avg_response_time_minutes: 65, total_requests_received: 320, total_offers_won: 95, total_offers_made: 250, sla_rating: "0.92", status: "active" },
];

type CarrierRow = (typeof mockCarriers)[0];

const columns: ColumnDef<CarrierRow>[] = [
  {
    accessorKey: "name",
    header: "Название",
    cell: ({ row }) => (
      <Link href={`/carriers/${row.original.id}`} className="text-primary hover:underline font-medium">
        {row.original.name}
      </Link>
    ),
  },
  {
    id: "regions",
    header: "Регионы",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.regions.map((r) => (
          <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
        ))}
      </div>
    ),
  },
  {
    id: "delivery_types",
    header: "Типы доставки",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.delivery_types.map((t) => (
          <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "avg_response_time_minutes",
    header: "Ср. время ответа",
    cell: ({ row }) => {
      const mins = row.original.avg_response_time_minutes;
      const color = mins <= 60 ? "text-green-600" : mins <= 240 ? "text-yellow-600" : "text-red-600";
      return <span className={`font-medium ${color}`}>{formatMinutesToDuration(mins)}</span>;
    },
  },
  {
    accessorKey: "total_requests_received",
    header: "Заявок",
    cell: ({ row }) => <span>{row.original.total_requests_received}</span>,
  },
  {
    accessorKey: "total_offers_won",
    header: "Выиграно",
    cell: ({ row }) => <span>{row.original.total_offers_won}</span>,
  },
  {
    id: "conversion",
    header: "Конверсия",
    cell: ({ row }) => {
      const rate = row.original.total_offers_made > 0
        ? ((row.original.total_offers_won / row.original.total_offers_made) * 100).toFixed(0)
        : "0";
      return <span>{rate}%</span>;
    },
  },
  {
    accessorKey: "sla_rating",
    header: "SLA рейтинг",
    cell: ({ row }) => {
      const rating = parseFloat(row.original.sla_rating) * 100;
      const color = rating >= 80 ? "text-green-600" : rating >= 60 ? "text-yellow-600" : "text-red-600";
      return <span className={`font-semibold ${color}`}>{rating.toFixed(0)}%</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Статус",
    cell: ({ row }) => <StatusBadge status={row.original.status} type="carrier" />,
  },
];

export default function CarriersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = mockCarriers.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Карго" description="Управление логистическими компаниями">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Добавить карго
        </Button>
      </PageHeader>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Поиск по названию..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {carrierStatuses.map((s) => (
              <SelectItem key={s} value={s}>{carrierStatusLabels[s] || s}</SelectItem>
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
        emptyTitle="Нет карго"
        emptyDescription="Добавьте первую логистическую компанию"
      />
    </div>
  );
}
