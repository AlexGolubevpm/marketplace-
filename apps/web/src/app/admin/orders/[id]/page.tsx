"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Truck, FileText, Upload, Download } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { orderStatusLabels, documentTypeLabels } from "@cargo/shared";

interface DocFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_by_role: string;
  created_at: string;
}

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
  updated_at: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [documents, setDocuments] = useState<DocFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      const found = data.find((o: any) => o.id === params.id);
      if (found) {
        setOrder(found);
        try {
          const docRes = await fetch(`/api/documents?order_id=${params.id}`);
          if (docRes.ok) {
            const docs = await docRes.json();
            setDocuments(Array.isArray(docs) ? docs : []);
          }
        } catch (err) { console.error("Failed to load documents:", err); }
      } else {
        setError("Заказ не найден");
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, status: newStatus }),
      });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-600">
          <ArrowLeft className="h-4 w-4" /> Назад
        </Link>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-lg bg-white animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-600">
          <ArrowLeft className="h-4 w-4" /> Назад
        </Link>
        <div className="p-6 rounded-lg bg-red-50 border border-red-200 text-red-600 text-center">
          {error || "Заказ не найден"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-600">
          <ArrowLeft className="h-4 w-4" /> Назад к заказам
        </Link>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-2" /> Обновить
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{order.display_id}</h1>
            <StatusBadge status={order.status} type="order" />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Создан: {new Date(order.created_at).toLocaleString("ru-RU")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Статус:</span>
          <Select value={order.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(orderStatusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Order info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="h-5 w-5 text-green-500" />
            <h2 className="font-semibold">Детали заказа</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Цена</span>
              <span className="font-medium text-lg">${parseFloat(order.price).toLocaleString()} {order.currency !== "USD" ? order.currency : ""}</span>
            </div>
            {order.tracking_number && (
              <div className="flex justify-between">
                <span className="text-gray-500">Трекинг</span>
                <span className="font-mono font-medium">{order.tracking_number}</span>
              </div>
            )}
            {order.estimated_delivery_date && (
              <div className="flex justify-between">
                <span className="text-gray-500">Ожидаемая доставка</span>
                <span className="font-medium">{new Date(order.estimated_delivery_date).toLocaleDateString("ru-RU")}</span>
              </div>
            )}
            {order.actual_delivery_date && (
              <div className="flex justify-between">
                <span className="text-gray-500">Фактическая доставка</span>
                <span className="font-medium">{new Date(order.actual_delivery_date).toLocaleDateString("ru-RU")}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-gray-200 bg-white">
          <h2 className="font-semibold mb-4">Связанные записи</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Заявка</span>
              <Link href={`/admin/requests/${order.request_id}`} className="text-blue-600 hover:underline font-mono">
                {order.request_id.slice(0, 8)}...
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Оффер</span>
              <Link href={`/admin/offers/${order.offer_id}`} className="text-blue-600 hover:underline font-mono">
                {order.offer_id.slice(0, 8)}...
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Клиент</span>
              <Link href={`/admin/customers/${order.customer_id}`} className="text-blue-600 hover:underline font-mono">
                {order.customer_id.slice(0, 8)}...
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Карго</span>
              <Link href={`/admin/carriers/${order.carrier_id}`} className="text-blue-600 hover:underline font-mono">
                {order.carrier_id.slice(0, 8)}...
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="p-5 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-500" />
            <h2 className="font-semibold">Документы</h2>
            {documents.length > 0 && <span className="text-gray-500 text-sm">({documents.length})</span>}
          </div>
          <label className={`inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            <Upload className="h-4 w-4 mr-1.5" />
            {uploading ? "Загрузка..." : "Загрузить"}
            <input type="file" className="hidden" disabled={uploading} onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              try {
                const formData = new FormData();
                formData.append("file", file);
                const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                if (!uploadRes.ok) throw new Error("Upload failed");
                const { url } = await uploadRes.json();
                await fetch("/api/documents", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ order_id: order.id, file_name: file.name, file_url: url, file_type: "other", uploaded_by_role: "admin" }),
                });
                await load();
              } catch (err) { console.error("Upload error:", err); }
              setUploading(false);
              e.target.value = "";
            }} />
          </label>
        </div>
        {documents.length === 0 ? (
          <p className="text-sm text-gray-400">Нет загруженных документов</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-200">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.file_name}</p>
                    <p className="text-xs text-gray-400">
                      {documentTypeLabels[doc.file_type] || doc.file_type} · {doc.uploaded_by_role} · {new Date(doc.created_at).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                </div>
                <a href={doc.file_url} download className="p-2 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0">
                  <Download className="h-4 w-4 text-cyan-500" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-400 space-y-1">
        <p>ID: {order.id}</p>
        <p>Обновлён: {new Date(order.updated_at).toLocaleString("ru-RU")}</p>
      </div>
    </div>
  );
}
