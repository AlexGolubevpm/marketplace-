"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface Carrier {
  id: string;
  name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  telegram_id: string | null;
  description: string | null;
  status: string;
  sla_rating: string | null;
  total_requests_received: number;
  total_offers_made: number;
  total_offers_won: number;
  created_at: string;
}

export default function CarriersPage() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    telegram_id: "",
    description: "",
  });

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/carriers");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setCarriers(data);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.name || !form.contact_name) {
      setError("Название и контактное лицо обязательны");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/carriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create");
      }
      setShowCreate(false);
      setForm({ name: "", contact_name: "", contact_phone: "", contact_email: "", telegram_id: "", description: "" });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить карго-компанию?")) return;
    try {
      await fetch("/api/carriers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Карго" description="Управление логистическими компаниями">
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Обновить
        </Button>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить
        </Button>
      </PageHeader>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {loading && carriers.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-white animate-pulse" />
          ))}
        </div>
      ) : carriers.length === 0 ? (
        <EmptyState
          title="Нет карго-компаний"
          description="Добавьте первую логистическую компанию"
          actionLabel="Добавить карго"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Контактное лицо</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Рейтинг</TableHead>
                <TableHead>Заявки</TableHead>
                <TableHead>Офферы</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carriers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.contact_name}</TableCell>
                  <TableCell className="text-sm">{c.contact_phone || "—"}</TableCell>
                  <TableCell className="text-sm">{c.contact_email || "—"}</TableCell>
                  <TableCell>
                    {c.sla_rating ? parseFloat(c.sla_rating).toFixed(1) : "—"}
                  </TableCell>
                  <TableCell>{c.total_requests_received}</TableCell>
                  <TableCell>
                    {c.total_offers_made}
                    {c.total_offers_won > 0 && (
                      <span className="text-green-400 ml-1">({c.total_offers_won} выигр.)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} type="carrier" />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(c.created_at).toLocaleDateString("ru-RU")}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
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
            <DialogTitle>Добавить карго-компанию</DialogTitle>
            <DialogDescription>Заполните данные логистической компании</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Название *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Cargo Express"
                />
              </div>
              <div className="space-y-2">
                <Label>Контактное лицо *</Label>
                <Input
                  value={form.contact_name}
                  onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                  placeholder="Иван Иванов"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Телефон</Label>
                <Input
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  placeholder="+7 999 123 4567"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  placeholder="email@cargo.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Telegram ID</Label>
              <Input
                value={form.telegram_id}
                onChange={(e) => setForm({ ...form, telegram_id: e.target.value })}
                placeholder="123456789"
              />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Специализация, регионы работы..."
                rows={3}
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
