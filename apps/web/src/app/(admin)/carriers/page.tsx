"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Plus, Trash2, Pencil, Ban, CheckCircle } from "lucide-react";
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

const emptyForm = {
  name: "",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  telegram_id: "",
  description: "",
};

export default function CarriersPage() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editCarrier, setEditCarrier] = useState<Carrier | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

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
      setForm(emptyForm);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
    setCreating(false);
  };

  const handleEdit = (c: Carrier) => {
    setEditCarrier(c);
    setEditForm({
      name: c.name || "",
      contact_name: c.contact_name || "",
      contact_phone: c.contact_phone || "",
      contact_email: c.contact_email || "",
      telegram_id: c.telegram_id || "",
      description: c.description || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editCarrier) return;
    setSaving(true);
    try {
      const res = await fetch("/api/carriers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editCarrier.id, ...editForm }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      setEditCarrier(null);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  };

  const handleToggleStatus = async (c: Carrier) => {
    const newStatus = c.status === "active" ? "suspended" : "active";
    const label = newStatus === "suspended" ? "Приостановить" : "Активировать";
    if (!confirm(`${label} карго-компанию ${c.name}?`)) return;
    try {
      await fetch("/api/carriers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, status: newStatus }),
      });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить карго-компанию? Это действие нельзя отменить.")) return;
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

  const carrierFormFields = (f: typeof form, setF: (v: typeof form) => void) => (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Название *</Label>
          <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Cargo Express" />
        </div>
        <div className="space-y-2">
          <Label>Контактное лицо *</Label>
          <Input value={f.contact_name} onChange={(e) => setF({ ...f, contact_name: e.target.value })} placeholder="Иван Иванов" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Телефон</Label>
          <Input value={f.contact_phone} onChange={(e) => setF({ ...f, contact_phone: e.target.value })} placeholder="+7 999 123 4567" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={f.contact_email} onChange={(e) => setF({ ...f, contact_email: e.target.value })} placeholder="email@cargo.com" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Telegram ID</Label>
        <Input value={f.telegram_id} onChange={(e) => setF({ ...f, telegram_id: e.target.value })} placeholder="123456789" />
      </div>
      <div className="space-y-2">
        <Label>Описание</Label>
        <Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Специализация, регионы работы..." rows={3} />
      </div>
    </div>
  );

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
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
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
                <TableHead>Офферы</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead className="text-right">Действия</TableHead>
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
                  <TableCell>
                    {c.total_offers_made}
                    {c.total_offers_won > 0 && (
                      <span className="text-green-500 ml-1">({c.total_offers_won} выигр.)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} type="carrier" />
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {new Date(c.created_at).toLocaleDateString("ru-RU")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(c)} title="Редактировать">
                        <Pencil className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(c)}
                        title={c.status === "active" ? "Приостановить" : "Активировать"}
                      >
                        {c.status === "active" ? (
                          <Ban className="h-4 w-4 text-orange-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} title="Удалить">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить карго-компанию</DialogTitle>
            <DialogDescription>Заполните данные логистической компании</DialogDescription>
          </DialogHeader>
          {carrierFormFields(form, setForm)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Отмена</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editCarrier} onOpenChange={(open) => !open && setEditCarrier(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать карго-компанию</DialogTitle>
            <DialogDescription>Измените данные компании</DialogDescription>
          </DialogHeader>
          {carrierFormFields(editForm, setEditForm)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCarrier(null)}>Отмена</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
