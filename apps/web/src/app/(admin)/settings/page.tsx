"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { Plus, Save } from "lucide-react";
import { adminRoleLabels } from "@cargo/shared";
import { formatDateTime } from "@/lib/utils";

// Mock data
const slaConfigs = [
  { id: "1", metric: "first_offer_time", threshold_value: "120", threshold_unit: "minutes", severity: "warning", is_active: true },
  { id: "2", metric: "first_offer_time", threshold_value: "240", threshold_unit: "minutes", severity: "critical", is_active: true },
  { id: "3", metric: "min_offers_count", threshold_value: "2", threshold_unit: "count", severity: "warning", is_active: true },
  { id: "4", metric: "min_offers_count", threshold_value: "1", threshold_unit: "count", severity: "critical", is_active: true },
  { id: "5", metric: "carrier_response_rate", threshold_value: "70", threshold_unit: "percent", severity: "warning", is_active: true },
  { id: "6", metric: "carrier_response_rate", threshold_value: "50", threshold_unit: "percent", severity: "critical", is_active: true },
];

const admins = [
  { id: "a1", email: "admin@cargo.com", full_name: "Администратор", role: "super_admin", status: "active", last_login_at: "2026-02-14T10:00:00" },
  { id: "a2", email: "operator@cargo.com", full_name: "Оператор Иванов", role: "operator", status: "active", last_login_at: "2026-02-14T09:30:00" },
  { id: "a3", email: "analyst@cargo.com", full_name: "Аналитик Петров", role: "analyst", status: "active", last_login_at: "2026-02-13T16:00:00" },
  { id: "a4", email: "content@cargo.com", full_name: "Контент Сидоров", role: "content_manager", status: "disabled", last_login_at: "2026-01-28T12:00:00" },
];

const auditLogs = [
  { id: "1", admin_name: "Администратор", action: "update_order_status", entity_type: "order", entity_id: "ORD-2026-0089", old_values: '{"status":"awaiting_shipment"}', new_values: '{"status":"in_transit"}', created_at: "2026-02-14T08:00:00" },
  { id: "2", admin_name: "Оператор Иванов", action: "block_carrier", entity_type: "carrier", entity_id: "ChinaRoad", old_values: '{"status":"active"}', new_values: '{"status":"blocked"}', created_at: "2026-02-14T07:30:00" },
  { id: "3", admin_name: "Администратор", action: "extend_deadline", entity_type: "request", entity_id: "REQ-2026-0140", old_values: null, new_values: '{"offer_deadline":"2026-02-16"}', created_at: "2026-02-13T16:00:00" },
  { id: "4", admin_name: "Контент Сидоров", action: "publish_content", entity_type: "landing_content", entity_id: "hero", old_values: null, new_values: '{"version":3}', created_at: "2026-02-10T14:00:00" },
];

const metricLabels: Record<string, string> = {
  first_offer_time: "Время первого оффера",
  min_offers_count: "Мин. кол-во офферов",
  carrier_response_rate: "% ответов карго",
  order_confirmation_time: "Время подтверждения заказа",
  carrier_response_time: "Время ответа карго",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Настройки" description="Конфигурация системы" />

      <Tabs defaultValue="sla">
        <TabsList>
          <TabsTrigger value="sla">SLA</TabsTrigger>
          <TabsTrigger value="admins">Роли и доступы</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="general">Общие</TabsTrigger>
        </TabsList>

        {/* SLA Config */}
        <TabsContent value="sla">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Конфигурация SLA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Метрика</th>
                      <th className="text-left py-3 px-2 font-medium">Порог</th>
                      <th className="text-left py-3 px-2 font-medium">Единица</th>
                      <th className="text-left py-3 px-2 font-medium">Серьёзность</th>
                      <th className="text-left py-3 px-2 font-medium">Статус</th>
                      <th className="text-left py-3 px-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {slaConfigs.map((config) => (
                      <tr key={config.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2">{metricLabels[config.metric] || config.metric}</td>
                        <td className="py-3 px-2">
                          <Input defaultValue={config.threshold_value} className="w-20 h-8" />
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">{config.threshold_unit}</td>
                        <td className="py-3 px-2">
                          <Badge variant={config.severity === "critical" ? "danger" : "warning"}>
                            {config.severity}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant={config.is_active ? "success" : "gray"}>
                            {config.is_active ? "Активно" : "Выключено"}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <Button variant="ghost" size="sm">
                            <Save className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admins */}
        <TabsContent value="admins">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Администраторы</CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" /> Добавить
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Имя</th>
                      <th className="text-left py-3 px-2 font-medium">Email</th>
                      <th className="text-left py-3 px-2 font-medium">Роль</th>
                      <th className="text-left py-3 px-2 font-medium">Статус</th>
                      <th className="text-left py-3 px-2 font-medium">Последний вход</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr key={admin.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium">{admin.full_name}</td>
                        <td className="py-3 px-2">{admin.email}</td>
                        <td className="py-3 px-2">
                          <Badge variant="outline">{adminRoleLabels[admin.role] || admin.role}</Badge>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant={admin.status === "active" ? "success" : "gray"}>
                            {admin.status === "active" ? "Активен" : "Отключён"}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">{formatDateTime(admin.last_login_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* RBAC Matrix */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Матрица прав доступа</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Ресурс</th>
                      <th className="text-center py-3 px-2 font-medium">Super Admin</th>
                      <th className="text-center py-3 px-2 font-medium">Оператор</th>
                      <th className="text-center py-3 px-2 font-medium">Аналитик</th>
                      <th className="text-center py-3 px-2 font-medium">Контент</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { resource: "Dashboard", sa: "full", op: "full", an: "read", cm: "—" },
                      { resource: "Заявки", sa: "full", op: "full", an: "read", cm: "—" },
                      { resource: "Офферы", sa: "full", op: "full", an: "read", cm: "—" },
                      { resource: "Заказы", sa: "full", op: "full", an: "read", cm: "—" },
                      { resource: "Карго", sa: "full", op: "full", an: "read", cm: "—" },
                      { resource: "Клиенты", sa: "full", op: "read", an: "read", cm: "—" },
                      { resource: "Аналитика", sa: "full", op: "read", an: "full", cm: "—" },
                      { resource: "Контент", sa: "full", op: "—", an: "—", cm: "full" },
                      { resource: "Настройки / SLA", sa: "full", op: "read", an: "—", cm: "—" },
                      { resource: "Управление админами", sa: "full", op: "—", an: "—", cm: "—" },
                      { resource: "Audit Log", sa: "full", op: "read", an: "read", cm: "—" },
                    ].map((row) => (
                      <tr key={row.resource} className="border-b">
                        <td className="py-2 px-2 font-medium">{row.resource}</td>
                        <td className="py-2 px-2 text-center">
                          <Badge variant={row.sa === "full" ? "success" : row.sa === "read" ? "info" : "gray"}>{row.sa}</Badge>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <Badge variant={row.op === "full" ? "success" : row.op === "read" ? "info" : "gray"}>{row.op}</Badge>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <Badge variant={row.an === "full" ? "success" : row.an === "read" ? "info" : "gray"}>{row.an}</Badge>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <Badge variant={row.cm === "full" ? "success" : row.cm === "read" ? "info" : "gray"}>{row.cm}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Журнал аудита</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Время</th>
                      <th className="text-left py-3 px-2 font-medium">Админ</th>
                      <th className="text-left py-3 px-2 font-medium">Действие</th>
                      <th className="text-left py-3 px-2 font-medium">Сущность</th>
                      <th className="text-left py-3 px-2 font-medium">Изменения</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                        <td className="py-3 px-2 font-medium">{log.admin_name}</td>
                        <td className="py-3 px-2">
                          <Badge variant="outline">{log.action}</Badge>
                        </td>
                        <td className="py-3 px-2">{log.entity_type}: {log.entity_id}</td>
                        <td className="py-3 px-2">
                          <span className="text-xs font-mono text-muted-foreground">
                            {log.old_values && <span className="text-red-600">{log.old_values}</span>}
                            {log.old_values && " → "}
                            {log.new_values && <span className="text-green-600">{log.new_values}</span>}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General */}
        <TabsContent value="general">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Общие настройки</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Таймзона</label>
                  <Select defaultValue="europe_moscow">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="europe_moscow">Europe/Moscow (UTC+3)</SelectItem>
                      <SelectItem value="asia_shanghai">Asia/Shanghai (UTC+8)</SelectItem>
                      <SelectItem value="utc">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Валюта по умолчанию</label>
                  <Select defaultValue="USD">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="RUB">RUB</SelectItem>
                      <SelectItem value="CNY">CNY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button>
                  <Save className="h-4 w-4 mr-2" /> Сохранить
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
