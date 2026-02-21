"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Save } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    phone: "",
    email: "",
    status: "active",
    notes: "",
  });

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      const found = data.find((c: any) => c.id === params.id);
      if (found) {
        setCustomer(found);
        setForm({
          full_name: found.full_name || "",
          company_name: found.company_name || "",
          phone: found.phone || "",
          email: found.email || "",
          status: found.status || "active",
          notes: found.notes || "",
        });
      } else {
        setError("Клиент не найден");
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!customer) return;
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: customer.id, ...form }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSuccess(true);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Link href="/admin/customers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-600">
          <ArrowLeft className="h-4 w-4" /> Назад
        </Link>
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-24 rounded-lg bg-white animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="space-y-6">
        <Link href="/admin/customers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-600">
          <ArrowLeft className="h-4 w-4" /> Назад
        </Link>
        <div className="p-6 rounded-lg bg-red-50 border border-red-200 text-red-600 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/customers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-600">
          <ArrowLeft className="h-4 w-4" /> Назад к клиентам
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-2" /> Обновить
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" /> {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
      {success && <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm">Сохранено</div>}

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{customer?.full_name || customer?.email || "Клиент"}</h1>
        <StatusBadge status={customer?.status || ""} type="customer" />
        {customer?.email_verified && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Email подтверждён</span>
        )}
      </div>

      {/* Edit form */}
      <div className="p-5 rounded-xl border border-gray-200 bg-white space-y-4">
        <h2 className="font-semibold">Редактирование</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>ФИО</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Компания</Label>
            <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Телефон</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Статус</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Активен</SelectItem>
                <SelectItem value="inactive">Неактивен</SelectItem>
                <SelectItem value="banned">Заблокирован</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Telegram</Label>
            <Input value={customer?.telegram_username ? `@${customer.telegram_username}` : customer?.telegram_id || "—"} disabled className="bg-gray-50" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Заметки</Label>
          <textarea
            className="w-full min-h-[80px] rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
      </div>

      {/* Meta */}
      <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-400 space-y-1">
        <p>ID: {customer?.id}</p>
        <p>Telegram ID: {customer?.telegram_id || "—"}</p>
        <p>Создан: {customer ? new Date(customer.created_at).toLocaleString("ru-RU") : ""}</p>
        <p>Обновлён: {customer ? new Date(customer.updated_at).toLocaleString("ru-RU") : ""}</p>
      </div>
    </div>
  );
}
