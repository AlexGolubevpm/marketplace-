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
  avg_response_time_minutes: number | null;
  total_requests_received: number;
  total_offers_made: number;
  total_offers_won: number;
  created_at: string;
  updated_at: string;
}

export default function CarrierDetailPage() {
  const params = useParams();
  const [carrier, setCarrier] = useState<Carrier | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    description: "",
    status: "active",
  });

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/carriers");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      const found = data.find((c: any) => c.id === params.id);
      if (found) {
        setCarrier(found);
        setForm({
          name: found.name || "",
          contact_name: found.contact_name || "",
          contact_phone: found.contact_phone || "",
          contact_email: found.contact_email || "",
          description: found.description || "",
          status: found.status || "active",
        });
      } else {
        setError("Карго не найден");
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
    if (!carrier) return;
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/carriers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: carrier.id, ...form }),
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
        <Link href="/admin/carriers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-600">
          <ArrowLeft className="h-4 w-4" /> Назад
        </Link>
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-24 rounded-lg bg-white animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error && !carrier) {
    return (
      <div className="space-y-6">
        <Link href="/admin/carriers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-600">
          <ArrowLeft className="h-4 w-4" /> Назад
        </Link>
        <div className="p-6 rounded-lg bg-red-50 border border-red-200 text-red-600 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/carriers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-600">
          <ArrowLeft className="h-4 w-4" /> Назад к карго
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
        <h1 className="text-2xl font-bold">{carrier?.name}</h1>
        <StatusBadge status={carrier?.status || ""} type="carrier" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Получено заявок", value: carrier?.total_requests_received ?? 0 },
          { label: "Офферов сделано", value: carrier?.total_offers_made ?? 0 },
          { label: "Офферов выиграно", value: carrier?.total_offers_won ?? 0 },
          { label: "SLA рейтинг", value: carrier?.sla_rating ? parseFloat(carrier.sla_rating).toFixed(2) : "—" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl border border-gray-200 bg-white text-center">
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Edit form */}
      <div className="p-5 rounded-xl border border-gray-200 bg-white space-y-4">
        <h2 className="font-semibold">Редактирование</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Название компании</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Контактное лицо</Label>
            <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Телефон</Label>
            <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Статус</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Активен</SelectItem>
                <SelectItem value="suspended">Приостановлен</SelectItem>
                <SelectItem value="blocked">Заблокирован</SelectItem>
                <SelectItem value="pending_review">На проверке</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Telegram ID</Label>
            <Input value={carrier?.telegram_id || ""} disabled className="bg-gray-50" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Описание</Label>
          <textarea
            className="w-full min-h-[80px] rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </div>

      {/* Meta */}
      <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-400 space-y-1">
        <p>ID: {carrier?.id}</p>
        <p>Создан: {carrier ? new Date(carrier.created_at).toLocaleString("ru-RU") : ""}</p>
        <p>Обновлён: {carrier ? new Date(carrier.updated_at).toLocaleString("ru-RU") : ""}</p>
      </div>
    </div>
  );
}
