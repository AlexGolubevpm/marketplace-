"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { requestSourceLabels } from "@cargo/shared";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RequestRow {
  id: string;
  display_id: string;
  customer_id: string;
  origin_country: string;
  origin_city: string;
  destination_country: string;
  destination_city: string;
  weight_kg: string | null;
  status: string;
  offer_count: number;
  source: string;
  created_at: string;
  customer_name: string | null;
  customer_company: string | null;
  customer_email: string | null;
  customer_phone: string | null;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/requests");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setRequests(data);
    } catch (e: any) {
      console.error("Failed to load requests:", e);
      setError(e.message || "Failed to load requests");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Заявки" description="Управление заявками на доставку">
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Обновить
        </Button>
      </PageHeader>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {loading && requests.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-white animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          title="Нет заявок"
          description="Заявки от клиентов появятся здесь автоматически"
        />
      ) : (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Маршрут</TableHead>
                <TableHead>Вес</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Офферы</TableHead>
                <TableHead>Источник</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-mono text-sm">
                    <Link href={`/admin/requests/${req.id}`} className="text-blue-600 hover:underline">
                      {req.display_id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm text-gray-900">
                        {req.customer_name || "—"}
                      </div>
                      {req.customer_company && (
                        <div className="text-xs text-gray-500">{req.customer_company}</div>
                      )}
                      {req.customer_email && (
                        <div className="text-xs text-gray-400">{req.customer_email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {req.origin_city || req.origin_country} → {req.destination_city || req.destination_country}
                  </TableCell>
                  <TableCell>
                    {req.weight_kg ? `${parseFloat(req.weight_kg).toLocaleString()} кг` : "—"}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {new Date(req.created_at).toLocaleDateString("ru-RU")}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={req.status} type="request" />
                  </TableCell>
                  <TableCell>
                    {req.offer_count > 0 ? (
                      <span className="text-sm font-medium">{req.offer_count}</span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {requestSourceLabels[req.source] || req.source}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
