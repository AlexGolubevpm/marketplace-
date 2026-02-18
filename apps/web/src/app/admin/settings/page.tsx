"use client";

import { PageHeader } from "@/components/page-header";
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
import { Save } from "lucide-react";

const slaConfigs = [
  { id: "1", metric: "Время первого оффера", threshold_value: "120", threshold_unit: "минут", severity: "warning", is_active: true },
  { id: "2", metric: "Время первого оффера", threshold_value: "240", threshold_unit: "минут", severity: "critical", is_active: true },
  { id: "3", metric: "Мин. кол-во офферов", threshold_value: "2", threshold_unit: "шт", severity: "warning", is_active: true },
  { id: "4", metric: "Мин. кол-во офферов", threshold_value: "1", threshold_unit: "шт", severity: "critical", is_active: true },
  { id: "5", metric: "% ответов карго", threshold_value: "70", threshold_unit: "%", severity: "warning", is_active: true },
  { id: "6", metric: "% ответов карго", threshold_value: "50", threshold_unit: "%", severity: "critical", is_active: true },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Настройки" description="Конфигурация системы" />

      <Tabs defaultValue="sla">
        <TabsList>
          <TabsTrigger value="sla">SLA</TabsTrigger>
          <TabsTrigger value="general">Общие</TabsTrigger>
        </TabsList>

        <TabsContent value="sla">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Метрика</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Порог</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Ед.</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Уровень</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Статус</th>
                </tr>
              </thead>
              <tbody>
                {slaConfigs.map((config) => (
                  <tr key={config.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">{config.metric}</td>
                    <td className="py-3 px-4"><Input defaultValue={config.threshold_value} className="w-20 h-8 bg-gray-100 border-gray-300" /></td>
                    <td className="py-3 px-4 text-gray-500">{config.threshold_unit}</td>
                    <td className="py-3 px-4">
                      <Badge variant={config.severity === "critical" ? "danger" : "warning"}>{config.severity}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={config.is_active ? "success" : "gray"}>{config.is_active ? "Активно" : "Выкл"}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="general">
          <div className="max-w-md p-6 rounded-xl border border-gray-200 bg-white space-y-4">
            <div>
              <label className="text-sm text-gray-500">Таймзона</label>
              <Select defaultValue="europe_moscow">
                <SelectTrigger className="mt-1 bg-gray-100 border-gray-300"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="europe_moscow">Europe/Moscow (UTC+3)</SelectItem>
                  <SelectItem value="asia_shanghai">Asia/Shanghai (UTC+8)</SelectItem>
                  <SelectItem value="utc">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-500">Валюта по умолчанию</label>
              <Select defaultValue="USD">
                <SelectTrigger className="mt-1 bg-gray-100 border-gray-300"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="RUB">RUB</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-sm font-medium">
              <Save className="h-4 w-4" /> Сохранить
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
