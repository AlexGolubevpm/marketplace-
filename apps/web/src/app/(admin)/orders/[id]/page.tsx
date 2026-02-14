"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  FileText,
  ExternalLink,
  Upload,
  Send,
} from "lucide-react";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { orderStatusTransitions, orderStatusLabels } from "@cargo/shared";

const mockOrder = {
  id: "1",
  display_id: "ORD-2026-0089",
  status: "in_transit",
  price: "3200.00",
  currency: "USD",
  commission_amount: "320.00",
  commission_rate: "0.1000",
  tracking_number: "GF-2026-1234",
  tracking_url: "https://tracking.globalfreight.com/GF-2026-1234",
  estimated_delivery_date: "2026-03-05",
  request_display_id: "REQ-2026-0139",
  offer_display_id: "OFF-2026-0200",
  customer_name: "Иванов Алексей",
  carrier_name: "GlobalFreight",
  created_at: "2026-02-13T14:00:00",
  history: [
    { from: null, to: "payment_pending", changed_by: "Система", source: "system", comment: "Заказ создан", created_at: "2026-02-13T14:00:00" },
    { from: "payment_pending", to: "confirmed", changed_by: "Оператор", source: "admin", comment: "Оплата подтверждена", created_at: "2026-02-13T15:30:00" },
    { from: "confirmed", to: "awaiting_shipment", changed_by: "Система", source: "system", comment: null, created_at: "2026-02-13T16:00:00" },
    { from: "awaiting_shipment", to: "in_transit", changed_by: "GlobalFreight", source: "carrier", comment: "Груз отправлен, трек: GF-2026-1234", created_at: "2026-02-14T08:00:00" },
  ],
  documents: [
    { id: "d1", file_name: "invoice_GF2026.pdf", file_type: "invoice", created_at: "2026-02-13T14:05:00" },
    { id: "d2", file_name: "bill_of_lading.pdf", file_type: "bill_of_lading", created_at: "2026-02-14T08:10:00" },
  ],
};

const allowedTransitions = orderStatusTransitions[mockOrder.status as keyof typeof orderStatusTransitions] || [];

export default function OrderDetailPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{mockOrder.display_id}</h1>
            <StatusBadge status={mockOrder.status} type="order" />
            <span className="text-lg font-semibold text-primary">{formatCurrency(mockOrder.price)}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Создан {formatDateTime(mockOrder.created_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Related Entities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Связанные сущности</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Заявка:</span>
                  <Link href="/requests/1" className="ml-2 text-primary hover:underline">
                    {mockOrder.request_display_id}
                  </Link>
                </div>
                <div>
                  <span className="text-muted-foreground">Оффер:</span>
                  <span className="ml-2">{mockOrder.offer_display_id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Клиент:</span>
                  <span className="ml-2 font-medium">{mockOrder.customer_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Карго:</span>
                  <span className="ml-2 font-medium">{mockOrder.carrier_name}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">История статусов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockOrder.history.map((entry, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      {i < mockOrder.history.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={entry.to} type="order" />
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(entry.created_at)}
                        </span>
                      </div>
                      <p className="text-sm mt-1">
                        <span className="text-muted-foreground">от:</span>{" "}
                        {entry.changed_by} ({entry.source})
                      </p>
                      {entry.comment && (
                        <p className="text-sm text-muted-foreground mt-0.5">{entry.comment}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Документы</CardTitle>
              <Button size="sm" variant="outline">
                <Upload className="h-4 w-4 mr-2" /> Загрузить
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockOrder.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">{doc.file_type} • {formatDateTime(doc.created_at)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tracking */}
          {mockOrder.tracking_number && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Трекинг</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Номер:</span>
                    <span className="ml-2 font-mono font-medium">{mockOrder.tracking_number}</span>
                  </div>
                  {mockOrder.tracking_url && (
                    <a href={mockOrder.tracking_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" /> Открыть
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Update Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Обновить статус</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  {allowedTransitions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {orderStatusLabels[s] || s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea placeholder="Комментарий (необязательно)" rows={2} />
              <Button className="w-full" disabled={allowedTransitions.length === 0}>
                Обновить
              </Button>
            </CardContent>
          </Card>

          {/* Finance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Финансы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Цена:</span>
                <span className="font-semibold">{formatCurrency(mockOrder.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Комиссия ({(parseFloat(mockOrder.commission_rate) * 100).toFixed(0)}%):</span>
                <span className="font-medium">{formatCurrency(mockOrder.commission_amount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground">Ожидаемая доставка:</span>
                <span className="font-medium">{mockOrder.estimated_delivery_date}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notify */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Уведомления</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                <Send className="h-4 w-4" /> Уведомить клиента
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                <Send className="h-4 w-4" /> Уведомить карго
              </Button>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Комментарии</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea placeholder="Добавить комментарий..." rows={3} />
              <Button size="sm">Отправить</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
