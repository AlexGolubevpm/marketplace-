"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
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
import { type Request, getRequests } from "@/lib/store";

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getRequests();
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
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
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
                    <Link href={`/requests/${req.id}`} className="text-cyan-400 hover:underline">
                      {req.display_id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {req.origin_city || req.origin_country} → {req.destination_city || req.destination_country}
                  </TableCell>
                  <TableCell>
                    {req.weight_kg ? `${parseFloat(req.weight_kg).toLocaleString()} кг` : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(req.created_at).toLocaleDateString("ru-RU")}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={req.status} type="request" />
                  </TableCell>
                  <TableCell>
                    {req.offer_count > 0 ? (
                      <span className="text-sm font-medium">{req.offer_count}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {req.source === "web_form" ? "Web" : req.source === "telegram_bot" ? "Telegram" : req.source}
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
