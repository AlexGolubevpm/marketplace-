"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { RefreshCw, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface Offer {
  id: string;
  display_id: string;
  request_id: string;
  carrier_id: string;
  price: string;
  currency: string;
  estimated_days: number;
  delivery_type: string;
  conditions: string | null;
  status: string;
  selected_at: string | null;
  created_at: string;
  carrier_name: string | null;
  carrier_contact: string | null;
  carrier_phone: string | null;
  carrier_email: string | null;
}

const deliveryLabels: Record<string, string> = {
  air: "Авиа",
  sea: "Море",
  rail: "ЖД",
  road: "Авто",
  multimodal: "Мульти",
};

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    request_id: "",
    carrier_id: "",
    carrier_name: "",
    price: "",
    currency: "USD",
    estimated_days_min: "",
    delivery_type: "sea",
    conditions: "",
  });

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/offers");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setOffers(data);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.request_id || !form.carrier_id || !form.price) {
      setError("Заявка, карго и цена обязательны");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          estimated_days_min: parseInt(form.estimated_days_min) || 14,
          estimated_days: parseInt(form.estimated_days_min) || 14,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create");
      }
      setShowCreate(false);
      setForm({ request_id: "", carrier_id: "", carrier_name: "", price: "", currency: "USD", estimated_days_min: "", delivery_type: "sea", conditions: "" });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
    setCreating(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Офферы" description="Управление предложениями карго">
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Обновить
        </Button>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Создать оффер
        </Button>
      </PageHeader>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
      )}

      {loading && offers.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-white animate-pulse" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <EmptyState
          title="Нет офферов"
          description="Офферы появятся когда карго ответят на заявки"
          actionLabel="Создать оффер"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Заявка</TableHead>
                <TableHead>Карго</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Срок (дн)</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer) => (
                <TableRow key={offer.id} className="cursor-pointer hover:bg-gray-50">
                  <TableCell className="font-mono text-sm">
                    <Link href={`/admin/offers/${offer.id}`} className="text-blue-600 hover:underline">{offer.display_id}</Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-blue-600">{offer.request_id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm text-gray-900">{offer.carrier_name || "—"}</div>
                      {offer.carrier_contact && (
                        <div className="text-xs text-gray-500">{offer.carrier_contact}</div>
                      )}
                      {offer.carrier_email && (
                        <div className="text-xs text-gray-400">{offer.carrier_email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${parseFloat(offer.price).toLocaleString()} {offer.currency !== "USD" ? offer.currency : ""}
                  </TableCell>
                  <TableCell>{offer.estimated_days}</TableCell>
                  <TableCell>{deliveryLabels[offer.delivery_type] || offer.delivery_type}</TableCell>
                  <TableCell>
                    <StatusBadge status={offer.status} type="offer" />
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {new Date(offer.created_at).toLocaleDateString("ru-RU")}
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
            <DialogTitle>Создать оффер</DialogTitle>
            <DialogDescription>Создайте предложение от имени карго-компании</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID заявки *</Label>
                <Input
                  value={form.request_id}
                  onChange={(e) => setForm({ ...form, request_id: e.target.value })}
                  placeholder="UUID заявки"
                />
              </div>
              <div className="space-y-2">
                <Label>ID карго *</Label>
                <Input
                  value={form.carrier_id}
                  onChange={(e) => setForm({ ...form, carrier_id: e.target.value })}
                  placeholder="UUID или TG ID карго"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Название карго</Label>
              <Input
                value={form.carrier_name}
                onChange={(e) => setForm({ ...form, carrier_name: e.target.value })}
                placeholder="Cargo Express"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Цена *</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="1500"
                />
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
                <Label>Срок (дн)</Label>
                <Input
                  type="number"
                  value={form.estimated_days_min}
                  onChange={(e) => setForm({ ...form, estimated_days_min: e.target.value })}
                  placeholder="14"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Тип доставки</Label>
              <Select value={form.delivery_type} onValueChange={(v) => setForm({ ...form, delivery_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sea">Море</SelectItem>
                  <SelectItem value="air">Авиа</SelectItem>
                  <SelectItem value="rail">ЖД</SelectItem>
                  <SelectItem value="road">Авто</SelectItem>
                  <SelectItem value="multimodal">Мультимодальная</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Условия</Label>
              <Input
                value={form.conditions}
                onChange={(e) => setForm({ ...form, conditions: e.target.value })}
                placeholder="Доп. условия"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Отмена</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
