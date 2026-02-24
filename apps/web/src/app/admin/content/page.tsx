"use client";

import { useState, useCallback, useRef } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Save,
  Plus,
  Trash2,
  GripVertical,
  CheckCircle,
  Upload,
  X,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { trpc } from "@/trpc/client";

type ItemFieldType = "text" | "textarea" | "icon-select" | "image-upload";

type FieldConfig = {
  key: string;
  label: string;
  type: "text" | "textarea" | "items" | "image";
  itemFields?: { key: string; label: string; type: ItemFieldType }[];
};

type SectionConfig = {
  id: string;
  name: string;
  description: string;
  fields: FieldConfig[];
};

const ICON_OPTIONS = [
  { value: "Plane", label: "Самолёт" },
  { value: "Ship", label: "Корабль" },
  { value: "TrainFront", label: "Поезд" },
  { value: "Truck", label: "Грузовик" },
  { value: "Shield", label: "Щит" },
  { value: "Clock", label: "Часы" },
  { value: "Globe", label: "Глобус" },
  { value: "BarChart3", label: "Диаграмма" },
  { value: "Star", label: "Звезда" },
  { value: "Zap", label: "Молния" },
  { value: "ClipboardList", label: "Заявка" },
  { value: "FileText", label: "Документ" },
  { value: "MapPin", label: "Точка" },
];

const SECTION_CONFIGS: SectionConfig[] = [
  {
    id: "branding",
    name: "Логотип и брендинг",
    description: "Логотип сайта и фавикон",
    fields: [
      { key: "logo_url", label: "Логотип (SVG, PNG)", type: "image" },
      { key: "logo_text", label: "Текст рядом с логотипом", type: "text" },
      { key: "favicon_url", label: "Фавикон", type: "image" },
    ],
  },
  {
    id: "hero",
    name: "Hero (главный экран)",
    description: "Заголовок, подзаголовок, кнопки, фон",
    fields: [
      { key: "background_image", label: "Фоновое изображение", type: "image" },
      { key: "badge", label: "Бейдж (метка вверху)", type: "text" },
      { key: "title_1", label: "Заголовок (1 строка)", type: "text" },
      { key: "title_accent", label: "Заголовок (акцент)", type: "text" },
      { key: "title_2", label: "Заголовок (2 строка)", type: "text" },
      { key: "title_fade", label: "Заголовок (затухающий)", type: "text" },
      { key: "subtitle", label: "Подзаголовок", type: "textarea" },
      { key: "cta_text", label: "Текст основной кнопки", type: "text" },
      { key: "cta_secondary_text", label: "Текст второй кнопки", type: "text" },
      { key: "telegram_url", label: "Ссылка на Telegram бот", type: "text" },
      {
        key: "checkmarks",
        label: "Преимущества под кнопкой",
        type: "items",
        itemFields: [{ key: "text", label: "Текст", type: "text" }],
      },
    ],
  },
  {
    id: "stats",
    name: "Статистика",
    description: "Числа и метрики",
    fields: [
      { key: "background_image", label: "Фоновое изображение секции", type: "image" },
      {
        key: "items",
        label: "Блоки статистики",
        type: "items",
        itemFields: [
          { key: "value", label: "Значение", type: "text" },
          { key: "label", label: "Подпись", type: "text" },
        ],
      },
    ],
  },
  {
    id: "delivery_types",
    name: "Виды доставки",
    description: "Карточки видов перевозки",
    fields: [
      { key: "section_label", label: "Надпись секции", type: "text" },
      { key: "title", label: "Заголовок", type: "text" },
      { key: "subtitle", label: "Подзаголовок", type: "text" },
      { key: "section_image", label: "Изображение секции", type: "image" },
      {
        key: "items",
        label: "Виды доставки",
        type: "items",
        itemFields: [
          { key: "icon", label: "Иконка", type: "icon-select" },
          { key: "image_url", label: "Картинка (вместо иконки)", type: "image-upload" },
          { key: "title", label: "Название", type: "text" },
          { key: "price", label: "Цена", type: "text" },
          { key: "period", label: "Срок", type: "text" },
        ],
      },
    ],
  },
  {
    id: "how_it_works",
    name: "Как это работает",
    description: "Шаги процесса",
    fields: [
      { key: "section_label", label: "Надпись секции", type: "text" },
      { key: "title", label: "Заголовок", type: "text" },
      { key: "subtitle", label: "Подзаголовок", type: "text" },
      { key: "section_image", label: "Изображение секции", type: "image" },
      {
        key: "steps",
        label: "Шаги",
        type: "items",
        itemFields: [
          { key: "num", label: "Номер", type: "text" },
          { key: "icon", label: "Иконка", type: "icon-select" },
          { key: "image_url", label: "Картинка (вместо иконки)", type: "image-upload" },
          { key: "title", label: "Заголовок", type: "text" },
          { key: "desc", label: "Описание", type: "text" },
        ],
      },
    ],
  },
  {
    id: "why_us",
    name: "Почему мы",
    description: "Преимущества платформы",
    fields: [
      { key: "section_label", label: "Надпись секции", type: "text" },
      { key: "title", label: "Заголовок", type: "text" },
      { key: "section_image", label: "Изображение секции", type: "image" },
      {
        key: "features",
        label: "Преимущества",
        type: "items",
        itemFields: [
          { key: "icon", label: "Иконка", type: "icon-select" },
          { key: "image_url", label: "Картинка (вместо иконки)", type: "image-upload" },
          { key: "title", label: "Заголовок", type: "text" },
          { key: "desc", label: "Описание", type: "text" },
        ],
      },
    ],
  },
  {
    id: "faq",
    name: "Частые вопросы",
    description: "FAQ секция",
    fields: [
      { key: "section_label", label: "Надпись секции", type: "text" },
      { key: "title", label: "Заголовок", type: "text" },
      {
        key: "items",
        label: "Вопросы и ответы",
        type: "items",
        itemFields: [
          { key: "q", label: "Вопрос", type: "text" },
          { key: "a", label: "Ответ", type: "textarea" },
        ],
      },
    ],
  },
  {
    id: "cta",
    name: "CTA (призыв к действию)",
    description: "Финальный блок с кнопками",
    fields: [
      { key: "background_image", label: "Фоновое изображение", type: "image" },
      { key: "title", label: "Заголовок", type: "text" },
      { key: "subtitle", label: "Подзаголовок", type: "text" },
      { key: "cta_text", label: "Текст основной кнопки", type: "text" },
      { key: "cta_secondary_text", label: "Текст второй кнопки", type: "text" },
    ],
  },
  {
    id: "seo",
    name: "SEO",
    description: "Мета-теги страницы",
    fields: [
      { key: "title", label: "Meta Title", type: "text" },
      { key: "description", label: "Meta Description", type: "textarea" },
      { key: "og_title", label: "OG Title", type: "text" },
      { key: "og_description", label: "OG Description", type: "text" },
      { key: "og_image", label: "OG Image (для соцсетей)", type: "image" },
    ],
  },
];

const DEFAULT_CONTENT: Record<string, Record<string, any>> = {
  branding: {
    logo_url: "",
    logo_text: "CNGO",
    favicon_url: "",
  },
  hero: {
    background_image: "",
    badge: "Первый карго маркетплейс",
    title_1: "Если важно ",
    title_accent: "принимать решения",
    title_2: "а не искать ",
    title_fade: "исполнителей",
    subtitle: "Вместо обзвона 20 компаний и 2 дней переговоров — 3–5 офферов с ценами за 2 часа. Сравните и выберите лучший.",
    cta_text: "Получить предложения",
    cta_secondary_text: "Через Telegram",
    telegram_url: "https://t.me/cargomarketplace_bot",
    checkmarks: [
      { text: "Бесплатно для клиентов" },
      { text: "От 3 офферов за 2 часа" },
      { text: "Проверенные карго-компании" },
    ],
  },
  stats: {
    background_image: "",
    items: [
      { value: "200+", label: "Карго-компаний" },
      { value: "<2ч", label: "Среднее время ответа" },
      { value: "98%", label: "Довольных клиентов" },
      { value: "5 000+", label: "Доставок выполнено" },
    ],
  },
  delivery_types: {
    section_label: "Виды доставки",
    title: "Любой способ перевозки",
    subtitle: "Подберём оптимальный вариант по цене и срокам",
    section_image: "",
    items: [
      { icon: "Plane", image_url: "", title: "Авиа", price: "от 10 $", period: "от 1 дня" },
      { icon: "TrainFront", image_url: "", title: "ЖД", price: "от 5 $", period: "от 15 дней" },
      { icon: "Truck", image_url: "", title: "Авто", price: "от 2 $", period: "от 25 дней" },
      { icon: "Ship", image_url: "", title: "Море", price: "от 1 $", period: "от 40 дней" },
    ],
  },
  how_it_works: {
    section_label: "Процесс",
    title: "Как это работает",
    subtitle: "4 простых шага до выгодной доставки",
    section_image: "",
    steps: [
      { num: "01", icon: "ClipboardList", image_url: "", title: "Опишите груз", desc: "Маршрут, вес, тип товара — оформление заявки за 2 минуты" },
      { num: "02", icon: "FileText", image_url: "", title: "Получите офферы", desc: "Карго-компании присылают предложения с ценами и сроками" },
      { num: "03", icon: "BarChart3", image_url: "", title: "Сравните и выберите", desc: "Удобное сравнение всех условий в единой таблице" },
      { num: "04", icon: "MapPin", image_url: "", title: "Отслеживайте", desc: "Статус заказа в реальном времени до момента получения" },
    ],
  },
  why_us: {
    section_label: "Преимущества",
    title: "Почему выбирают нас",
    section_image: "",
    features: [
      { icon: "Shield", image_url: "", title: "Проверенные карго", desc: "Каждая компания проходит верификацию перед подключением к платформе" },
      { icon: "Clock", image_url: "", title: "Экономия времени", desc: "Вместо обзвона десятков компаний — офферы приходят к вам" },
      { icon: "Globe", image_url: "", title: "Любые маршруты", desc: "Китай, Турция, Европа → Россия, Казахстан, Узбекистан" },
      { icon: "BarChart3", image_url: "", title: "Прозрачное сравнение", desc: "Цена, сроки, условия — всё в одной таблице для быстрого выбора" },
      { icon: "Star", image_url: "", title: "Рейтинг надёжности", desc: "Система оценки карго-компаний по скорости и качеству работы" },
      { icon: "Zap", image_url: "", title: "Быстрый старт", desc: "Заявка за 2 минуты, первые офферы — уже через час" },
    ],
  },
  faq: {
    section_label: "FAQ",
    title: "Частые вопросы",
    items: [
      { q: "Сколько стоит использование платформы?", a: "Для клиентов — бесплатно. Платформа зарабатывает на комиссии с карго-компаний." },
      { q: "Какие сроки доставки?", a: "Зависит от типа: авиа — от 7 дней, ЖД — от 14 дней, море — от 25 дней." },
      { q: "Как проверяются карго-компании?", a: "Каждая компания проходит верификацию: проверка документов, история работы, отзывы клиентов." },
      { q: "Можно ли отменить заявку?", a: "Да, до момента выбора оффера заявку можно отменить или изменить в любое время." },
      { q: "Какие маршруты доступны?", a: "Основные направления: Китай, Турция, Европа → Россия, Казахстан, Узбекистан, Кыргызстан." },
    ],
  },
  cta: {
    background_image: "",
    title: "Готовы начать?",
    subtitle: "Создайте заявку за 2 минуты и получите предложения от проверенных карго-компаний",
    cta_text: "Получить предложения",
    cta_secondary_text: "Я карго-компания",
  },
  seo: {
    title: "CNGO — Карго маркетплейс",
    description: "Первый карго-маркетплейс для доставки грузов из Китая.",
    og_title: "CNGO — Карго маркетплейс",
    og_description: "Найдите лучшее предложение по доставке груза",
    og_image: "",
  },
};

/* ── Upload helper ── */
async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Upload failed");
  }
  const data = await res.json();
  return data.url;
}

/* ── ImageUpload component (section-level) ── */
function ImageUpload({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch (e: any) {
      setError(e.message || "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <Label>{label}</Label>
      {value ? (
        <div className="mt-2 relative inline-block">
          <img
            src={value}
            alt={label}
            className="max-h-32 rounded-lg border border-gray-200 object-contain bg-gray-50"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`mt-2 flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
            dragOver
              ? "border-blue-400 bg-blue-50"
              : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
          }`}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-gray-300" />
              <p className="text-xs text-gray-400">
                Перетащите файл или нажмите для загрузки
              </p>
              <p className="text-[10px] text-gray-300">
                JPEG, PNG, WebP, SVG, GIF. Макс. 5 МБ
              </p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </div>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

/* ── Compact ImageUpload for item fields ── */
function ItemImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch (e: any) {
      setError(e.message || "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {value ? (
        <div className="mt-1 flex items-center gap-2">
          <img
            src={value}
            alt="uploaded"
            className="h-10 w-10 rounded-lg border border-gray-200 object-cover bg-gray-50"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Удалить
          </button>
        </div>
      ) : (
        <div className="mt-1 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Upload className="h-3 w-3 mr-1" />
            )}
            Загрузить
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </div>
      )}
      {error && <p className="text-[10px] text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}

function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:border-blue-400"
    >
      <option value="">Выберите иконку</option>
      {ICON_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

export default function ContentPage() {
  const [activeSectionId, setActiveSectionId] = useState(SECTION_CONFIGS[0].id);
  const [sectionData, setSectionData] = useState<Record<string, Record<string, any>>>(DEFAULT_CONTENT);
  const [saveStatus, setSaveStatus] = useState<Record<string, "saved" | "saving" | "error" | null>>({});

  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const updateMutation = trpc.content.update.useMutation({
    onSuccess: () => {
      setErrorDetail(null);
      setSaveStatus((prev) => ({ ...prev, [activeSectionId]: "saved" }));
      setTimeout(() => setSaveStatus((prev) => ({ ...prev, [activeSectionId]: null })), 3000);
    },
    onError: (err) => {
      console.error("[content.update] Error:", err.message, err);
      setErrorDetail(err.message);
      setSaveStatus((prev) => ({ ...prev, [activeSectionId]: "error" }));
    },
  });

  const activeConfig = SECTION_CONFIGS.find((s) => s.id === activeSectionId)!;
  const activeData = sectionData[activeSectionId] || {};

  const updateField = useCallback((key: string, value: any) => {
    setSectionData((prev) => ({
      ...prev,
      [activeSectionId]: { ...prev[activeSectionId], [key]: value },
    }));
  }, [activeSectionId]);

  const updateItemField = useCallback((listKey: string, index: number, fieldKey: string, value: any) => {
    setSectionData((prev) => {
      const items = [...(prev[activeSectionId]?.[listKey] || [])];
      items[index] = { ...items[index], [fieldKey]: value };
      return { ...prev, [activeSectionId]: { ...prev[activeSectionId], [listKey]: items } };
    });
  }, [activeSectionId]);

  const addItem = useCallback((listKey: string, itemFields: FieldConfig["itemFields"]) => {
    setSectionData((prev) => {
      const items = [...(prev[activeSectionId]?.[listKey] || [])];
      const newItem: Record<string, string> = {};
      itemFields?.forEach((f) => { newItem[f.key] = ""; });
      items.push(newItem);
      return { ...prev, [activeSectionId]: { ...prev[activeSectionId], [listKey]: items } };
    });
  }, [activeSectionId]);

  const removeItem = useCallback((listKey: string, index: number) => {
    setSectionData((prev) => {
      const items = [...(prev[activeSectionId]?.[listKey] || [])];
      items.splice(index, 1);
      return { ...prev, [activeSectionId]: { ...prev[activeSectionId], [listKey]: items } };
    });
  }, [activeSectionId]);

  const handleSave = () => {
    console.log("[content.update] Saving:", { section: activeSectionId, content: activeData });
    setSaveStatus((prev) => ({ ...prev, [activeSectionId]: "saving" }));
    setErrorDetail(null);
    updateMutation.mutate({
      section: activeSectionId,
      content: activeData,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Контент лендинга" description="Редактирование секций главной страницы" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Секции</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-2">
            {SECTION_CONFIGS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSectionId(s.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeSectionId === s.id
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-[11px] opacity-50 mt-0.5">{s.description}</p>
                  </div>
                  {saveStatus[s.id] === "saved" && (
                    <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                  )}
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
                  <CardTitle className="text-base">{activeConfig.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{activeConfig.description}</p>
                </div>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {saveStatus[activeSectionId] === "saved" && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" /> Секция сохранена и опубликована
                </div>
              )}
              {saveStatus[activeSectionId] === "error" && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                  Ошибка сохранения: {errorDetail || "Неизвестная ошибка"}
                </div>
              )}

              {activeConfig.fields.map((field) => (
                <div key={field.key}>
                  {field.type === "text" && (
                    <div>
                      <Label>{field.label}</Label>
                      <Input
                        className="mt-1"
                        value={activeData[field.key] || ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        placeholder={field.label}
                      />
                    </div>
                  )}

                  {field.type === "textarea" && (
                    <div>
                      <Label>{field.label}</Label>
                      <Textarea
                        className="mt-1"
                        rows={4}
                        value={activeData[field.key] || ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        placeholder={field.label}
                      />
                    </div>
                  )}

                  {field.type === "image" && (
                    <ImageUpload
                      label={field.label}
                      value={activeData[field.key] || ""}
                      onChange={(url) => updateField(field.key, url)}
                    />
                  )}

                  {field.type === "items" && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label>{field.label}</Label>
                        <Button variant="outline" size="sm" onClick={() => addItem(field.key, field.itemFields)}>
                          <Plus className="h-3 w-3 mr-1" /> Добавить
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {(activeData[field.key] || []).map((item: any, idx: number) => (
                          <div key={idx} className="relative p-4 rounded-xl border border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <GripVertical className="h-4 w-4 text-gray-300" />
                                <span className="text-xs text-gray-400 font-mono">#{idx + 1}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-300 hover:text-red-500"
                                onClick={() => removeItem(field.key, idx)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {field.itemFields?.map((itemField) => (
                                <div key={itemField.key} className={itemField.type === "textarea" ? "sm:col-span-2" : ""}>
                                  <Label className="text-xs">{itemField.label}</Label>
                                  {itemField.type === "icon-select" ? (
                                    <IconSelect
                                      value={item[itemField.key] || ""}
                                      onChange={(v) => updateItemField(field.key, idx, itemField.key, v)}
                                    />
                                  ) : itemField.type === "image-upload" ? (
                                    <ItemImageUpload
                                      value={item[itemField.key] || ""}
                                      onChange={(url) => updateItemField(field.key, idx, itemField.key, url)}
                                    />
                                  ) : itemField.type === "textarea" ? (
                                    <Textarea
                                      className="mt-1"
                                      rows={2}
                                      value={item[itemField.key] || ""}
                                      onChange={(e) => updateItemField(field.key, idx, itemField.key, e.target.value)}
                                    />
                                  ) : (
                                    <Input
                                      className="mt-1"
                                      value={item[itemField.key] || ""}
                                      onChange={(e) => updateItemField(field.key, idx, itemField.key, e.target.value)}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
