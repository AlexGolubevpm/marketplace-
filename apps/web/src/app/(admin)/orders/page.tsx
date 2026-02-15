"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

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
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    request_id: "",
    offer_id: "",
    customer_id: "",
    carrier_id: "",
    price: "",
    currency: "USD",
    tracking_number: "",
    status: "payment_pending",
  });

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

  const handleCreate = async () => {
    if (!form.request_id || !form.offer_id || !form.customer_id || !form.carrier_id || !form.price) {
      setError("Все обязательные поля должны быть заполнены");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create");
      }
      setShowCreate(false);
      setForm({ request_id: "", offer_id: "", customer_id: "", carrier_id: "", price: "", currency: "USD", tracking_number: "", status: "payment_pending" });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
    setCreating(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Заказы" description="Управление заказами и отслеживание доставки">
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Обновить
        </Button>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Создать заказ
        </Button>
      </PageHeader>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
      )}

      {loading && orders.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="Нет заказов"
          description="Заказы создаются автоматически при выборе оффера клиентом"
          actionLabel="Создать заказ"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
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
                        <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:underline">
                          {order.tracking_number}
                        </a>
                      ) : (
                        order.tracking_number
                      )
                    ) : (
                      <span className="text-gray-300">—</span>
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

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать заказ</DialogTitle>
            <DialogDescription>Создайте заказ вручную, указав заявку, оффер и участников</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID заявки *</Label>
                <Input value={form.request_id} onChange={(e) => setForm({ ...form, request_id: e.target.value })} placeholder="UUID заявки" />
              </div>
              <div className="space-y-2">
                <Label>ID оффера *</Label>
                <Input value={form.offer_id} onChange={(e) => setForm({ ...form, offer_id: e.target.value })} placeholder="UUID оффера" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID клиента *</Label>
                <Input value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} placeholder="UUID клиента" />
              </div>
              <div className="space-y-2">
                <Label>ID карго *</Label>
                <Input value={form.carrier_id} onChange={(e) => setForm({ ...form, carrier_id: e.target.value })} placeholder="UUID карго" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Цена *</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="1500" />
              </div>
              <div className="space-y-2">
                <Label>Валюта</Label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="RUB">RUB</SelectItem>
                    <SelectItem value="CNY">CNY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Статус</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment_pending">Ожидает оплаты</SelectItem>
                    <SelectItem value="confirmed">Подтверждён</SelectItem>
                    <SelectItem value="awaiting_shipment">Ожидает отгрузки</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Трекинг номер</Label>
              <Input value={form.tracking_number} onChange={(e) => setForm({ ...form, tracking_number: e.target.value })} placeholder="Опционально" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Отмена</Button>
            <Button onClick={handleCreate} disabled={creating}>{creating ? "Создание..." : "Создать"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
