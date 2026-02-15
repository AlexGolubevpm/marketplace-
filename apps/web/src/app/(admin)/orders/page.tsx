"use client";

import { useEffect, useState, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Order {
  id: string;
  display_id: string;
  request_id: string;
  offer_id: string;
  customer_id: string;
  carrier_id: string;
  status: string;
  price: string;
  currency: string;
  tracking_number: string | null;
  tracking_url: string | null;
  estimated_delivery_date: string | null;
  actual_delivery_date: string | null;
  created_at: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setOrders(data);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Заказы" description="Управление заказами и отслеживание доставки">
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Обновить
        </Button>
      </PageHeader>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {loading && orders.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-white/[0.02] animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="Нет заказов"
          description="Заказы создаются автоматически при выборе оффера клиентом"
        />
      ) : (
        <div className="rounded-lg border border-white/[0.06] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Трекинг</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата создания</TableHead>
                <TableHead>Изменить статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.display_id}</TableCell>
                  <TableCell className="font-medium">
                    ${parseFloat(order.price).toLocaleString()} {order.currency !== "USD" ? order.currency : ""}
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.tracking_number ? (
                      order.tracking_url ? (
                        <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                          {order.tracking_number}
                        </a>
                      ) : (
                        order.tracking_number
                      )
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} type="order" />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(order.created_at).toLocaleDateString("ru-RU")}
                  </TableCell>
                  <TableCell>
                    <Select value={order.status} onValueChange={(v) => handleStatusChange(order.id, v)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="payment_pending">Ожидает оплаты</SelectItem>
                        <SelectItem value="confirmed">Подтверждён</SelectItem>
                        <SelectItem value="awaiting_shipment">Ожидает отгрузки</SelectItem>
                        <SelectItem value="in_transit">В пути</SelectItem>
                        <SelectItem value="customs">Таможня</SelectItem>
                        <SelectItem value="customs_hold">Задержка на таможне</SelectItem>
                        <SelectItem value="delivered">Доставлен</SelectItem>
                        <SelectItem value="completed">Завершён</SelectItem>
                        <SelectItem value="cancelled">Отменён</SelectItem>
                        <SelectItem value="dispute">Спор</SelectItem>
                      </SelectContent>
                    </Select>
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
