"use client";

import { useState, useEffect } from "react";
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
import { Save, Check, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { trpc } from "@/trpc/client";

const DEFAULT_SLA_CONFIGS = [
  { id: "1", metric: "Время первого оффера", threshold_value: "120", threshold_unit: "минут", severity: "warning", is_active: true },
  { id: "2", metric: "Время первого оффера", threshold_value: "240", threshold_unit: "минут", severity: "critical", is_active: true },
  { id: "3", metric: "Мин. кол-во офферов", threshold_value: "2", threshold_unit: "шт", severity: "warning", is_active: true },
  { id: "4", metric: "Мин. кол-во офферов", threshold_value: "1", threshold_unit: "шт", severity: "critical", is_active: true },
  { id: "5", metric: "% ответов карго", threshold_value: "70", threshold_unit: "%", severity: "warning", is_active: true },
  { id: "6", metric: "% ответов карго", threshold_value: "50", threshold_unit: "%", severity: "critical", is_active: true },
];

function SlaSettings() {
  const slaQuery = trpc.settings.getSla.useQuery();
  const slaConfigs = slaQuery.data && slaQuery.data.length > 0 ? slaQuery.data : DEFAULT_SLA_CONFIGS;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {slaQuery.isLoading && (
        <div className="p-4 text-sm text-gray-400 flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" /> Загрузка SLA конфигов...
        </div>
      )}
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
          {slaConfigs.map((config: any) => (
            <tr key={config.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="py-3 px-4">{config.metric}</td>
              <td className="py-3 px-4"><Input defaultValue={String(config.threshold_value)} className="w-20 h-8 bg-gray-100 border-gray-300" /></td>
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
  );
}

function SeoSettings() {
  const contentSection = trpc.content.getSection.useQuery({ section: "analytics" });
  const updateContent = trpc.content.update.useMutation();

  const [formData, setFormData] = useState({
    yandex_metrika_id: "",
    google_analytics_id: "",
    google_search_console_code: "",
    yandex_webmaster_code: "",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (contentSection.data?.content) {
      const c = contentSection.data.content as Record<string, string>;
      setFormData({
        yandex_metrika_id: c.yandex_metrika_id || "",
        google_analytics_id: c.google_analytics_id || "",
        google_search_console_code: c.google_search_console_code || "",
        yandex_webmaster_code: c.yandex_webmaster_code || "",
      });
    }
  }, [contentSection.data]);

  const handleSave = async () => {
    try {
      setError("");
      // Basic validation
      if (formData.yandex_metrika_id && !/^\d+$/.test(formData.yandex_metrika_id.trim())) {
        setError("ID Яндекс.Метрики должен быть числовым");
        return;
      }
      if (formData.google_analytics_id && !/^G-[A-Z0-9]+$/i.test(formData.google_analytics_id.trim())) {
        setError("Google Analytics ID должен быть в формате G-XXXXXXXXXX");
        return;
      }

      await updateContent.mutateAsync({
        section: "analytics",
        content: {
          yandex_metrika_id: formData.yandex_metrika_id.trim(),
          google_analytics_id: formData.google_analytics_id.trim(),
          google_search_console_code: formData.google_search_console_code.trim(),
          yandex_webmaster_code: formData.yandex_webmaster_code.trim(),
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      contentSection.refetch();
    } catch (e: any) {
      setError(e.message || "Ошибка сохранения");
    }
  };

  return (
    <div className="space-y-6">
      {/* Counters & Analytics */}
      <div className="max-w-lg p-6 rounded-xl border border-gray-200 bg-white space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Счётчики и аналитика</h3>
          <p className="text-sm text-gray-500">
            Коды аналитики и верификации автоматически вставляются в &lt;head&gt; на всех страницах сайта.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Яндекс.Метрика — ID счётчика</label>
          <Input
            placeholder="Например: 12345678"
            value={formData.yandex_metrika_id}
            onChange={(e) => setFormData({ ...formData, yandex_metrika_id: e.target.value })}
            className="mt-1"
          />
          <p className="text-xs text-gray-400 mt-1">Только числовой ID (без скрипта). Включает webvisor, карту кликов, точный показатель отказов.</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Google Analytics 4 — Measurement ID</label>
          <Input
            placeholder="Например: G-XXXXXXXXXX"
            value={formData.google_analytics_id}
            onChange={(e) => setFormData({ ...formData, google_analytics_id: e.target.value })}
            className="mt-1"
          />
          <p className="text-xs text-gray-400 mt-1">Measurement ID из GA4 (начинается с G-)</p>
        </div>
      </div>

      {/* Verification codes */}
      <div className="max-w-lg p-6 rounded-xl border border-gray-200 bg-white space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Верификация в поисковых системах</h3>
          <p className="text-sm text-gray-500">
            Мета-теги верификации для подтверждения владения сайтом.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Google Search Console — код верификации</label>
          <Input
            placeholder="Например: abc123xyz..."
            value={formData.google_search_console_code}
            onChange={(e) => setFormData({ ...formData, google_search_console_code: e.target.value })}
            className="mt-1"
          />
          <p className="text-xs text-gray-400 mt-1">
            Значение content из тега &lt;meta name=&quot;google-site-verification&quot;&gt;
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Яндекс.Вебмастер — код верификации</label>
          <Input
            placeholder="Например: abc123xyz..."
            value={formData.yandex_webmaster_code}
            onChange={(e) => setFormData({ ...formData, yandex_webmaster_code: e.target.value })}
            className="mt-1"
          />
          <p className="text-xs text-gray-400 mt-1">
            Значение content из тега &lt;meta name=&quot;yandex-verification&quot;&gt;
          </p>
        </div>
      </div>

      {/* Save button & info */}
      <div className="max-w-lg p-6 rounded-xl border border-gray-200 bg-white space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={updateContent.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-sm font-medium disabled:opacity-50"
        >
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Сохранено" : updateContent.isPending ? "Сохранение..." : "Сохранить все настройки SEO"}
        </button>

        <div className="pt-3 border-t border-gray-100 space-y-2">
          <p className="text-xs font-medium text-gray-500">Полезные ссылки</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <a href="/sitemap.xml" target="_blank" className="flex items-center gap-1 text-blue-500 hover:underline">
              <ExternalLink className="h-3 w-3" /> /sitemap.xml
            </a>
            <a href="/knowledge/sitemap.xml" target="_blank" className="flex items-center gap-1 text-blue-500 hover:underline">
              <ExternalLink className="h-3 w-3" /> /knowledge/sitemap.xml
            </a>
            <a href="/robots.txt" target="_blank" className="flex items-center gap-1 text-blue-500 hover:underline">
              <ExternalLink className="h-3 w-3" /> /robots.txt
            </a>
          </div>
          <p className="text-xs text-gray-400">
            После сохранения коды появятся на сайте в течение 5 минут (кэш).
          </p>
        </div>
      </div>
    </div>
  );
}

function GeneralSettings() {
  const contentSection = trpc.content.getSection.useQuery({ section: "general_settings" });
  const updateContent = trpc.content.update.useMutation();
  const [timezone, setTimezone] = useState("europe_moscow");
  const [currency, setCurrency] = useState("USD");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (contentSection.data?.content) {
      const c = contentSection.data.content as Record<string, string>;
      setTimezone(c.timezone || "europe_moscow");
      setCurrency(c.currency || "USD");
    }
  }, [contentSection.data]);

  const handleSave = async () => {
    await updateContent.mutateAsync({
      section: "general_settings",
      content: { timezone, currency },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-md p-6 rounded-xl border border-gray-200 bg-white space-y-4">
      <div>
        <label className="text-sm text-gray-500">Таймзона</label>
        <Select value={timezone} onValueChange={setTimezone}>
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
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="mt-1 bg-gray-100 border-gray-300"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="RUB">RUB</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <button
        onClick={handleSave}
        disabled={updateContent.isPending}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-sm font-medium disabled:opacity-50"
      >
        {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {saved ? "Сохранено" : "Сохранить"}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Настройки" description="Конфигурация системы" />

      <Tabs defaultValue="seo">
        <TabsList>
          <TabsTrigger value="seo">SEO / Счётчики</TabsTrigger>
          <TabsTrigger value="sla">SLA</TabsTrigger>
          <TabsTrigger value="general">Общие</TabsTrigger>
        </TabsList>

        <TabsContent value="seo">
          <SeoSettings />
        </TabsContent>

        <TabsContent value="sla">
          <SlaSettings />
        </TabsContent>

        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
