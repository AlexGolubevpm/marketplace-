"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import { ArrowLeft, Ban, ShieldCheck } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

const mockCustomer = {
  id: "c1",
  telegram_id: "123456789",
  telegram_username: "@alexivanov",
  phone: "+7 916 123-45-67",
  email: "alex@technoimport.ru",
  full_name: "Иванов Алексей",
  company_name: "ТехноИмпорт",
  status: "active",
  notes: "VIP клиент, крупные заказы электроники",
  created_at: "2025-11-15T10:00:00",
  requests: [
    { display_id: "REQ-2026-0142", status: "offers_received", route: "CN → RU", created_at: "2026-02-14" },
    { display_id: "REQ-2026-0120", status: "offer_selected", route: "CN → RU", created_at: "2026-02-08" },
    { display_id: "REQ-2026-0098", status: "closed", route: "CN → RU", created_at: "2026-01-25" },
  ],
  orders: [
    { display_id: "ORD-2026-0089", status: "in_transit", price: "3200.00", carrier: "GlobalFreight" },
    { display_id: "ORD-2026-0072", status: "completed", price: "6500.00", carrier: "FastCargo" },
    { display_id: "ORD-2026-0055", status: "completed", price: "5900.00", carrier: "SilkWay Express" },
  ],
};

export default function CustomerDetailPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{mockCustomer.full_name}</h1>
            <StatusBadge status={mockCustomer.status} type="customer" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {mockCustomer.telegram_username} • Регистрация: {formatDate(mockCustomer.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mockCustomer.status === "active" ? (
            <Button variant="destructive" size="sm">
              <Ban className="h-4 w-4 mr-2" /> Забанить
            </Button>
          ) : (
            <Button variant="outline" size="sm">
              <ShieldCheck className="h-4 w-4 mr-2" /> Разбанить
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Профиль</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>ФИО</Label>
              <Input defaultValue={mockCustomer.full_name} className="mt-1" />
            </div>
            <div>
              <Label>Telegram ID</Label>
              <Input defaultValue={mockCustomer.telegram_id} className="mt-1" disabled />
            </div>
            <div>
              <Label>Username</Label>
              <Input defaultValue={mockCustomer.telegram_username} className="mt-1" />
            </div>
            <div>
              <Label>Телефон</Label>
              <Input defaultValue={mockCustomer.phone || ""} className="mt-1" />
            </div>
            <div>
              <Label>Email</Label>
              <Input defaultValue={mockCustomer.email || ""} className="mt-1" />
            </div>
            <div>
              <Label>Компания</Label>
              <Input defaultValue={mockCustomer.company_name || ""} className="mt-1" />
            </div>
            <div>
              <Label>Заметки (приватные)</Label>
              <Textarea defaultValue={mockCustomer.notes || ""} className="mt-1" rows={3} />
            </div>
            <Button>Сохранить</Button>
          </CardContent>
        </Card>

        {/* Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Заявки ({mockCustomer.requests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockCustomer.requests.map((r) => (
                <div key={r.display_id} className="flex items-center justify-between p-2 rounded border">
                  <div>
                    <Link href="/requests/1" className="text-sm text-primary hover:underline font-medium">
                      {r.display_id}
                    </Link>
                    <p className="text-xs text-muted-foreground">{r.route} • {r.created_at}</p>
                  </div>
                  <StatusBadge status={r.status} type="request" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Заказы ({mockCustomer.orders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockCustomer.orders.map((o) => (
                <div key={o.display_id} className="flex items-center justify-between p-2 rounded border">
                  <div>
                    <Link href="/orders/1" className="text-sm text-primary hover:underline font-medium">
                      {o.display_id}
                    </Link>
                    <p className="text-xs text-muted-foreground">{o.carrier} • {formatCurrency(o.price)}</p>
                  </div>
                  <StatusBadge status={o.status} type="order" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
