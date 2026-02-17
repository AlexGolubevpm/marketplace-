"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Plus, Trash2, Pencil, Ban, CheckCircle } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface Customer {
  id: string;
  telegram_id: string | null;
  telegram_username: string | null;
  phone: string | null;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  telegram_id: "",
  telegram_username: "",
  company_name: "",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setCustomers(data);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/customers", {
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

  const handleEdit = (c: Customer) => {
    setEditCustomer(c);
    setEditForm({
      full_name: c.full_name || "",
      email: c.email || "",
      phone: c.phone || "",
      telegram_id: c.telegram_id || "",
      telegram_username: c.telegram_username || "",
      company_name: c.company_name || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editCustomer) return;
    setSaving(true);
    try {
      const res = await fetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editCustomer.id, ...editForm }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      setEditCustomer(null);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  };

  const handleToggleStatus = async (c: Customer) => {
    const newStatus = c.status === "active" ? "banned" : "active";
    const label = newStatus === "banned" ? "Приостановить" : "Активировать";
    if (!confirm(`${label} клиента ${c.full_name || c.email || c.id}?`)) return;
    try {
      await fetch("/api/customers", {
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
    if (!confirm("Удалить клиента? Это действие нельзя отменить.")) return;
    try {
      await fetch("/api/customers", {
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
      <PageHeader title="Клиенты" description="Управление клиентами маркетплейса">
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

      {loading && customers.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-white animate-pulse" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          title="Нет клиентов"
          description="Добавьте первого клиента"
          actionLabel="Добавить клиента"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Имя</TableHead>
                <TableHead>Компания</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Telegram</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.full_name || "—"}</TableCell>
                  <TableCell>{c.company_name || "—"}</TableCell>
                  <TableCell className="text-sm">{c.email || "—"}</TableCell>
                  <TableCell className="text-sm">{c.phone || "—"}</TableCell>
                  <TableCell className="text-sm">
                    {c.telegram_username ? `@${c.telegram_username}` : c.telegram_id || "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} type="customer" />
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
            <DialogTitle>Добавить клиента</DialogTitle>
            <DialogDescription>Заполните данные нового клиента</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Имя</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Иван Иванов" />
              </div>
              <div className="space-y-2">
                <Label>Компания</Label>
                <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="ООО Компания" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Телефон</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+7 999 123 4567" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telegram ID</Label>
                <Input value={form.telegram_id} onChange={(e) => setForm({ ...form, telegram_id: e.target.value })} placeholder="123456789" />
              </div>
              <div className="space-y-2">
                <Label>Telegram Username</Label>
                <Input value={form.telegram_username} onChange={(e) => setForm({ ...form, telegram_username: e.target.value })} placeholder="username" />
              </div>
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

      {/* Edit dialog */}
      <Dialog open={!!editCustomer} onOpenChange={(open) => !open && setEditCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать клиента</DialogTitle>
            <DialogDescription>Измените данные клиента</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Имя</Label>
                <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} placeholder="Иван Иванов" />
              </div>
              <div className="space-y-2">
                <Label>Компания</Label>
                <Input value={editForm.company_name} onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })} placeholder="ООО Компания" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Телефон</Label>
                <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+7 999 123 4567" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telegram ID</Label>
                <Input value={editForm.telegram_id} onChange={(e) => setEditForm({ ...editForm, telegram_id: e.target.value })} placeholder="123456789" />
              </div>
              <div className="space-y-2">
                <Label>Telegram Username</Label>
                <Input value={editForm.telegram_username} onChange={(e) => setEditForm({ ...editForm, telegram_username: e.target.value })} placeholder="username" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCustomer(null)}>Отмена</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
