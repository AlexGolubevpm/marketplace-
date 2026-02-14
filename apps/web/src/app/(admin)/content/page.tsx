"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Upload, History, Eye, RotateCcw } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const sections = [
  {
    id: "hero",
    name: "Hero (главный экран)",
    fields: [
      { key: "title", label: "Заголовок", type: "text", value: "Доставка грузов из Китая" },
      { key: "subtitle", label: "Подзаголовок", type: "text", value: "Быстро, надёжно, выгодно" },
      { key: "cta_text", label: "Текст кнопки", type: "text", value: "Рассчитать стоимость" },
      { key: "cta_url", label: "URL кнопки", type: "text", value: "https://t.me/cargo_bot" },
    ],
    version: 3,
    is_published: true,
    updated_at: "2026-02-10T14:00:00",
  },
  {
    id: "how_it_works",
    name: "Как это работает",
    fields: [
      { key: "steps", label: "Шаги (JSON)", type: "textarea", value: '[{"title":"Опишите груз","description":"Укажите маршрут, вес и тип товара"},{"title":"Получите предложения","description":"Карго-компании пришлют офферы"},{"title":"Выберите лучший","description":"Сравните цены и сроки"}]' },
    ],
    version: 2,
    is_published: true,
    updated_at: "2026-02-05T10:00:00",
  },
  {
    id: "faq",
    name: "Вопросы и ответы",
    fields: [
      { key: "items", label: "FAQ (JSON)", type: "textarea", value: '[{"q":"Сколько стоит доставка?","a":"Стоимость зависит от маршрута и веса. Получите расчёт бесплатно."},{"q":"Какие сроки доставки?","a":"От 7 дней авиа до 35 дней морем."}]' },
    ],
    version: 4,
    is_published: true,
    updated_at: "2026-02-12T16:00:00",
  },
  {
    id: "seo",
    name: "SEO",
    fields: [
      { key: "title", label: "Meta Title", type: "text", value: "Cargo Marketplace — Доставка грузов из Китая" },
      { key: "description", label: "Meta Description", type: "textarea", value: "Карго-маркетплейс для доставки грузов из Китая в Россию и СНГ. Сравните цены и сроки от проверенных карго-компаний." },
      { key: "og_title", label: "OG Title", type: "text", value: "Cargo Marketplace" },
      { key: "og_description", label: "OG Description", type: "text", value: "Найдите лучшее предложение по доставке груза" },
    ],
    version: 2,
    is_published: true,
    updated_at: "2026-02-08T11:00:00",
  },
];

export default function ContentPage() {
  const [activeSection, setActiveSection] = useState(sections[0].id);

  const section = sections.find((s) => s.id === activeSection)!;

  return (
    <div className="space-y-6">
      <PageHeader title="Контент лендинга" description="Управление текстами и контентом" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Секции</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-2">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeSection === s.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{s.name}</span>
                  <Badge variant={s.is_published ? "success" : "gray"} className="text-xs">
                    v{s.version}
                  </Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Editor */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{section.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Версия {section.version} • Обновлено {formatDateTime(section.updated_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <History className="h-4 w-4 mr-2" /> История
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" /> Предпросмотр
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <Label>{field.label}</Label>
                  {field.type === "textarea" ? (
                    <Textarea defaultValue={field.value} className="mt-1 font-mono text-sm" rows={5} />
                  ) : (
                    <Input defaultValue={field.value} className="mt-1" />
                  )}
                </div>
              ))}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button>
                  <Save className="h-4 w-4 mr-2" /> Сохранить черновик
                </Button>
                <Button variant="secondary">
                  <Upload className="h-4 w-4 mr-2" /> Опубликовать
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
