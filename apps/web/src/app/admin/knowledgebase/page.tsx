"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Save, Trash2, ArrowLeft, BookOpen, Tag, FolderOpen,
  ExternalLink, Eye, EyeOff, Star, StarOff, Globe, AlertCircle,
  HelpCircle,
} from "lucide-react";
import { trpc } from "@/trpc/client";

// ── Slugify ───────────────────────────────────────────────────────────────────
function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[а-яё]/g, (ch) => {
      const map: Record<string, string> = {
        а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"j",
        к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",
        х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
      };
      return map[ch] || ch;
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ── Types ─────────────────────────────────────────────────────────────────────
type Category = {
  id: string; title: string; slug: string; description: string | null;
  image_url: string | null; icon: string | null; order: number;
  is_active: boolean; meta_title: string | null; meta_description: string | null;
  canonical_override: string | null; article_count?: number;
};

type Article = {
  id: string; title: string; slug: string; description: string | null;
  category_id: string | null; content: string; status: "draft" | "published";
  author_name: string | null; reviewer_name: string | null; is_featured: boolean;
  canonical_override: string | null; redirects_from: string[] | null;
  faq_items: Array<{ question: string; answer: string }> | null;
  sources: Array<{ title: string; url: string }> | null;
  sort_order: number; tag_ids?: string[];
};

type KbTag = {
  id: string; title: string; slug: string; description: string | null;
  meta_title: string | null; meta_description: string | null;
};

type Redirect = {
  id: string; from_path: string; to_path: string; status_code: number;
};

// ═════════════════════════════════════════════════════════════════════════════
// CATEGORIES TAB
// ═════════════════════════════════════════════════════════════════════════════
function CategoriesTab() {
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState<Partial<Category> | null>(null);

  const { data: categories = [] } = trpc.knowledge.adminListCategories.useQuery();
  const createCat = trpc.knowledge.adminCreateCategory.useMutation({
    onSuccess: () => { utils.knowledge.adminListCategories.invalidate(); setEditing(null); },
  });
  const updateCat = trpc.knowledge.adminUpdateCategory.useMutation({
    onSuccess: () => { utils.knowledge.adminListCategories.invalidate(); setEditing(null); },
  });
  const deleteCat = trpc.knowledge.adminDeleteCategory.useMutation({
    onSuccess: () => { utils.knowledge.adminListCategories.invalidate(); setEditing(null); },
  });

  function handleSave() {
    if (!editing?.title) return;
    const slug = editing.slug || slugify(editing.title);
    if (editing.id) {
      const current = categories.find((c) => c.id === editing.id);
      updateCat.mutate({
        id: editing.id,
        title: editing.title,
        slug,
        description: editing.description ?? undefined,
        image_url: editing.image_url ?? undefined,
        icon: editing.icon ?? undefined,
        order: editing.order ?? 0,
        is_active: editing.is_active ?? true,
        meta_title: editing.meta_title ?? undefined,
        meta_description: editing.meta_description ?? undefined,
        canonical_override: editing.canonical_override ?? undefined,
        old_slug: current?.slug !== slug ? current?.slug : undefined,
      });
    } else {
      createCat.mutate({
        title: editing.title,
        slug,
        description: editing.description ?? undefined,
        image_url: editing.image_url ?? undefined,
        icon: editing.icon ?? undefined,
        order: editing.order ?? categories.length,
        is_active: editing.is_active ?? true,
        meta_title: editing.meta_title ?? undefined,
        meta_description: editing.meta_description ?? undefined,
      });
    }
  }

  if (editing) {
    return (
      <div className="space-y-6">
        <div>
          <button onClick={() => setEditing(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="h-4 w-4" /> Назад
          </button>
          <PageHeader title={editing.id ? "Редактировать категорию" : "Новая категория"} />
        </div>
        <Card><CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Название *</Label>
              <Input className="mt-1" value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.slug || slugify(e.target.value) })} />
            </div>
            <div>
              <Label>Slug (URL) *</Label>
              <Input className="mt-1" value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Описание (SEO текст на странице)</Label>
            <Textarea className="mt-1" rows={3} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>URL изображения</Label>
              <Input className="mt-1" placeholder="https://..." value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} />
            </div>
            <div>
              <Label>Иконка (эмодзи или текст)</Label>
              <Input className="mt-1" placeholder="📦" value={editing.icon ?? ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Порядок</Label>
              <Input className="mt-1" type="number" value={editing.order ?? 0} onChange={(e) => setEditing({ ...editing, order: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Label>Активна</Label>
              <button onClick={() => setEditing({ ...editing, is_active: !editing.is_active })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editing.is_active !== false ? "bg-green-500" : "bg-gray-200"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editing.is_active !== false ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">SEO</p>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label>Meta Title</Label>
                <Input className="mt-1" value={editing.meta_title ?? ""} onChange={(e) => setEditing({ ...editing, meta_title: e.target.value })} placeholder={editing.title ? `${editing.title} — доставка из Китая | Cargo Marketplace` : ""} />
              </div>
              <div>
                <Label>Meta Description (120–160 символов)</Label>
                <Textarea className="mt-1" rows={2} value={editing.meta_description ?? ""} onChange={(e) => setEditing({ ...editing, meta_description: e.target.value })} />
                <p className="text-xs text-muted-foreground mt-1">{(editing.meta_description ?? "").length} симв.</p>
              </div>
              <div>
                <Label>Canonical (опционально)</Label>
                <Input className="mt-1" value={editing.canonical_override ?? ""} onChange={(e) => setEditing({ ...editing, canonical_override: e.target.value })} placeholder="https://cargomarketplace.ru/knowledge/category/..." />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button onClick={handleSave} disabled={createCat.isPending || updateCat.isPending}><Save className="h-4 w-4 mr-2" /> Сохранить</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Отмена</Button>
            {editing.id && (
              <Button variant="destructive" className="ml-auto" onClick={() => { if (confirm("Удалить категорию?")) deleteCat.mutate({ id: editing.id! }); }}>
                <Trash2 className="h-4 w-4 mr-2" /> Удалить
              </Button>
            )}
          </div>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{categories.length} категорий</p>
        <Button onClick={() => setEditing({ title: "", slug: "", is_active: true, order: categories.length })}>
          <Plus className="h-4 w-4 mr-2" /> Новая категория
        </Button>
      </div>
      <div className="space-y-2">
        {categories.map((cat) => (
          <Card key={cat.id} className="hover:border-primary/30 cursor-pointer transition-colors" onClick={() => setEditing(cat as Partial<Category>)}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl">
                  {cat.image_url ? <img src={cat.image_url} alt="" className="w-full h-full object-cover rounded-lg" /> : (cat.icon ?? "📂")}
                </div>
                <div>
                  <p className="font-medium">{cat.title}</p>
                  <p className="text-xs text-muted-foreground">/knowledge/category/{cat.slug} · {(cat as any).article_count ?? 0} статей</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={cat.is_active ? "success" : "gray"}>{cat.is_active ? "Активна" : "Скрыта"}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {categories.length === 0 && (
          <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mb-3 opacity-30" />
            <p>Категорий пока нет</p>
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ARTICLES TAB
// ═════════════════════════════════════════════════════════════════════════════
function ArticlesTab() {
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState<Partial<Article> | null>(null);
  const [faqInput, setFaqInput] = useState<{ q: string; a: string }>({ q: "", a: "" });
  const [sourceInput, setSourceInput] = useState<{ title: string; url: string }>({ title: "", url: "" });
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: articles = [] } = trpc.knowledge.adminListArticles.useQuery({});
  const { data: categories = [] } = trpc.knowledge.adminListCategories.useQuery();
  const { data: tags = [] } = trpc.knowledge.adminListTags.useQuery();

  const createA = trpc.knowledge.adminCreateArticle.useMutation({
    onSuccess: (data) => { console.log("[KB] Article created:", data); utils.knowledge.adminListArticles.invalidate(); setSaveError(null); setEditing(null); },
    onError: (err) => { console.error("[KB] Create article error:", err.message, err); setSaveError(err.message); },
  });
  const updateA = trpc.knowledge.adminUpdateArticle.useMutation({
    onSuccess: (data) => { console.log("[KB] Article updated:", data); utils.knowledge.adminListArticles.invalidate(); setSaveError(null); setEditing(null); },
    onError: (err) => { console.error("[KB] Update article error:", err.message, err); setSaveError(err.message); },
  });
  const deleteA = trpc.knowledge.adminDeleteArticle.useMutation({
    onSuccess: () => { console.log("[KB] Article deleted"); utils.knowledge.adminListArticles.invalidate(); setSaveError(null); setEditing(null); },
    onError: (err) => { console.error("[KB] Delete article error:", err.message, err); setSaveError(err.message); },
  });

  // Fetch full article with tag_ids when editing existing article
  function openArticle(article: typeof articles[number]) {
    utils.knowledge.adminGetArticle.fetch({ id: article.id }).then((full) => {
      if (full) setEditing({ ...full, tag_ids: full.tag_ids ?? [] });
      else setEditing({ ...article, tag_ids: [] });
    }).catch(() => {
      setEditing({ ...article, tag_ids: [] });
    });
  }

  function handleSave(statusOverride?: "draft" | "published") {
    console.log("[KB] handleSave called, statusOverride:", statusOverride, "editing:", { id: editing?.id, title: editing?.title, content: editing?.content?.slice(0, 50), status: editing?.status, category_id: editing?.category_id });
    if (!editing?.title) { setSaveError("Укажите заголовок статьи"); console.warn("[KB] Blocked: empty title"); return; }
    if (!editing?.content) { setSaveError("Укажите содержимое статьи"); console.warn("[KB] Blocked: empty content"); return; }
    setSaveError(null);
    const slug = editing.slug || slugify(editing.title);
    const status = statusOverride ?? editing.status ?? "draft";
    console.log("[KB] Sending mutation, isNew:", !editing.id, "status:", status, "slug:", slug);
    const base = {
      title: editing.title,
      slug,
      description: editing.description ?? undefined,
      category_id: editing.category_id ?? undefined,
      content: editing.content ?? "",
      faq_items: editing.faq_items ?? [],
      sources: editing.sources ?? [],
      status,
      author_name: editing.author_name ?? undefined,
      reviewer_name: editing.reviewer_name ?? undefined,
      is_featured: editing.is_featured ?? false,
      canonical_override: editing.canonical_override ?? undefined,
      redirects_from: editing.redirects_from ?? [],
      sort_order: editing.sort_order ?? 0,
      tag_ids: editing.tag_ids ?? [],
    };

    if (editing.id) {
      const current = articles.find((a) => a.id === editing.id);
      updateA.mutate({ id: editing.id, ...base, old_slug: current?.slug !== slug ? current?.slug : undefined });
    } else {
      createA.mutate(base);
    }
  }

  if (editing) {
    const faqItems = editing.faq_items ?? [];
    const sources = editing.sources ?? [];
    const selectedTags = editing.tag_ids ?? [];

    return (
      <div className="space-y-6">
        <div>
          <button onClick={() => setEditing(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="h-4 w-4" /> Назад к статьям
          </button>
          <PageHeader title={editing.id ? "Редактировать статью" : "Новая статья"} />
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main content */}
          <div className="col-span-2 space-y-5">
            <Card><CardContent className="pt-6 space-y-4">
              <div>
                <Label>Заголовок *</Label>
                <Input className="mt-1 text-lg font-semibold" value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.slug || slugify(e.target.value) })} placeholder="Заголовок статьи" />
              </div>
              <div>
                <Label>Краткий ответ / Meta Description (120–160 символов)</Label>
                <Textarea className="mt-1" rows={3} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Краткое описание — отображается в поиске и в начале статьи" />
                <p className="text-xs text-muted-foreground mt-1">{(editing.description ?? "").length} симв.</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Содержимое (Markdown + компоненты)</Label>
                  <a href="https://cargomarketplace.ru/knowledge" target="_blank" rel="noopener" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
                    <ExternalLink className="h-3 w-3" /> Предпросмотр
                  </a>
                </div>
                <div className="text-xs text-muted-foreground mb-2 space-x-2">
                  <code>:::callout</code>
                  <code>:::notice type="warning"</code>
                  <code>:::steps</code>
                  <code>:::checklist</code>
                  <code>:::compare</code>
                </div>
                <Textarea className="mt-1 font-mono text-sm" rows={20} value={editing.content ?? ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} placeholder="## Заголовок раздела&#10;&#10;Текст статьи..." />
              </div>
            </CardContent></Card>

            {/* FAQ */}
            <Card><CardContent className="pt-6 space-y-4">
              <p className="font-semibold text-sm">Вопросы и ответы (FAQ)</p>
              {faqItems.map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm">{item.question}</p>
                    <button onClick={() => setEditing({ ...editing, faq_items: faqItems.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.answer}</p>
                </div>
              ))}
              <div className="border rounded-lg p-3 space-y-2">
                <Input placeholder="Вопрос" value={faqInput.q} onChange={(e) => setFaqInput({ ...faqInput, q: e.target.value })} />
                <Textarea rows={2} placeholder="Ответ" value={faqInput.a} onChange={(e) => setFaqInput({ ...faqInput, a: e.target.value })} />
                <Button size="sm" variant="outline" onClick={() => {
                  if (faqInput.q && faqInput.a) {
                    setEditing({ ...editing, faq_items: [...faqItems, { question: faqInput.q, answer: faqInput.a }] });
                    setFaqInput({ q: "", a: "" });
                  }
                }}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Добавить вопрос
                </Button>
              </div>
            </CardContent></Card>

            {/* Sources */}
            <Card><CardContent className="pt-6 space-y-4">
              <p className="font-semibold text-sm">Источники</p>
              {sources.map((src, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{src.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{src.url}</p>
                  </div>
                  <button onClick={() => setEditing({ ...editing, sources: sources.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600 shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div className="border rounded-lg p-3 space-y-2">
                <Input placeholder="Название источника" value={sourceInput.title} onChange={(e) => setSourceInput({ ...sourceInput, title: e.target.value })} />
                <Input placeholder="URL (https://...)" value={sourceInput.url} onChange={(e) => setSourceInput({ ...sourceInput, url: e.target.value })} />
                <Button size="sm" variant="outline" onClick={() => {
                  if (sourceInput.title && sourceInput.url) {
                    setEditing({ ...editing, sources: [...sources, { title: sourceInput.title, url: sourceInput.url }] });
                    setSourceInput({ title: "", url: "" });
                  }
                }}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Добавить источник
                </Button>
              </div>
            </CardContent></Card>
          </div>

          {/* Sidebar settings */}
          <div className="space-y-4">
            {/* Publish */}
            <Card><CardContent className="pt-5 space-y-4">
              {saveError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Статус</Label>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant={editing.status === "draft" ? "default" : "outline"} className="flex-1 text-xs" onClick={() => setEditing({ ...editing, status: "draft" })}>
                    Черновик
                  </Button>
                  <Button
                    size="sm"
                    variant={editing.status === "published" ? "default" : "outline"}
                    className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white"
                    disabled={createA.isPending || updateA.isPending}
                    onClick={() => handleSave("published")}
                  >
                    Опубликовать
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Избранная</span>
                <button onClick={() => setEditing({ ...editing, is_featured: !editing.is_featured })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editing.is_featured ? "bg-amber-400" : "bg-gray-200"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editing.is_featured ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button className="flex-1" onClick={() => handleSave()} disabled={createA.isPending || updateA.isPending}>
                  <Save className="h-4 w-4 mr-2" /> Сохранить
                </Button>
              </div>
              {editing.id && (
                <Button variant="destructive" size="sm" className="w-full" onClick={() => { if (confirm("Удалить статью?")) deleteA.mutate({ id: editing.id! }); }}>
                  <Trash2 className="h-4 w-4 mr-2" /> Удалить
                </Button>
              )}
            </CardContent></Card>

            {/* Category */}
            <Card><CardContent className="pt-5 space-y-3">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Категория</Label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={editing.category_id ?? ""}
                onChange={(e) => setEditing({ ...editing, category_id: e.target.value || null })}
              >
                <option value="">— Без категории —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </CardContent></Card>

            {/* Tags */}
            <Card><CardContent className="pt-5 space-y-3">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Теги</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const active = selectedTags.includes(tag.id);
                  return (
                    <button key={tag.id} onClick={() => {
                      setEditing({ ...editing, tag_ids: active ? selectedTags.filter((id) => id !== tag.id) : [...selectedTags, tag.id] });
                    }} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${active ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      #{tag.title}
                    </button>
                  );
                })}
                {tags.length === 0 && <p className="text-xs text-muted-foreground">Нет тегов</p>}
              </div>
            </CardContent></Card>

            {/* SEO */}
            <Card><CardContent className="pt-5 space-y-3">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">SEO</Label>
              <div>
                <Label className="text-xs">Slug (URL)</Label>
                <Input className="mt-1 text-sm" value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Автор</Label>
                <Input className="mt-1 text-sm" value={editing.author_name ?? ""} onChange={(e) => setEditing({ ...editing, author_name: e.target.value })} placeholder="Имя автора" />
              </div>
              <div>
                <Label className="text-xs">Проверено</Label>
                <Input className="mt-1 text-sm" value={editing.reviewer_name ?? ""} onChange={(e) => setEditing({ ...editing, reviewer_name: e.target.value })} placeholder="Имя проверяющего" />
              </div>
              <div>
                <Label className="text-xs">Canonical URL (опционально)</Label>
                <Input className="mt-1 text-sm" value={editing.canonical_override ?? ""} onChange={(e) => setEditing({ ...editing, canonical_override: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Редиректы (старые URL, один на строку)</Label>
                <Textarea className="mt-1 text-sm font-mono" rows={3} value={(editing.redirects_from ?? []).join("\n")} onChange={(e) => setEditing({ ...editing, redirects_from: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })} placeholder="/knowledge/old-slug" />
              </div>
            </CardContent></Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{articles.length} статей</p>
        <Button onClick={() => setEditing({ title: "", slug: "", content: "", status: "draft", faq_items: [], sources: [], redirects_from: [], tag_ids: [], is_featured: false })}>
          <Plus className="h-4 w-4 mr-2" /> Новая статья
        </Button>
      </div>
      <div className="space-y-2">
        {articles.map((a) => (
          <Card key={a.id} className="hover:border-primary/30 cursor-pointer transition-colors" onClick={() => openArticle(a)}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{a.title}</p>
                    {a.is_featured && <Star className="h-3.5 w-3.5 text-amber-400" />}
                  </div>
                  <p className="text-xs text-muted-foreground">/knowledge/{a.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {a.category_id && (
                  <span className="text-xs text-muted-foreground">
                    {categories.find((c) => c.id === a.category_id)?.title}
                  </span>
                )}
                <Badge variant={a.status === "published" ? "success" : "gray"}>
                  {a.status === "published" ? "Опубл." : "Черновик"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {articles.length === 0 && (
          <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mb-3 opacity-30" />
            <p>Статей пока нет</p>
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAGS TAB
// ═════════════════════════════════════════════════════════════════════════════
function TagsTab() {
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState<Partial<KbTag> | null>(null);

  const { data: tags = [] } = trpc.knowledge.adminListTags.useQuery();
  const create = trpc.knowledge.adminCreateTag.useMutation({
    onSuccess: () => { utils.knowledge.adminListTags.invalidate(); setEditing(null); },
  });
  const update = trpc.knowledge.adminUpdateTag.useMutation({
    onSuccess: () => { utils.knowledge.adminListTags.invalidate(); setEditing(null); },
  });
  const del = trpc.knowledge.adminDeleteTag.useMutation({
    onSuccess: () => { utils.knowledge.adminListTags.invalidate(); setEditing(null); },
  });

  function handleSave() {
    if (!editing?.title) return;
    const slug = editing.slug || slugify(editing.title);
    if (editing.id) {
      const current = tags.find((t) => t.id === editing.id);
      update.mutate({ id: editing.id, title: editing.title, slug, description: editing.description ?? undefined, meta_title: editing.meta_title ?? undefined, meta_description: editing.meta_description ?? undefined, old_slug: current?.slug !== slug ? current?.slug : undefined });
    } else {
      create.mutate({ title: editing.title, slug, description: editing.description ?? undefined, meta_title: editing.meta_title ?? undefined, meta_description: editing.meta_description ?? undefined });
    }
  }

  if (editing) {
    return (
      <div className="space-y-6">
        <div>
          <button onClick={() => setEditing(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="h-4 w-4" /> Назад
          </button>
          <PageHeader title={editing.id ? "Редактировать тег" : "Новый тег"} />
        </div>
        <Card><CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Название *</Label><Input className="mt-1" value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.slug || slugify(e.target.value) })} /></div>
            <div><Label>Slug *</Label><Input className="mt-1" value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></div>
          </div>
          <div><Label>Описание</Label><Textarea className="mt-1" rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">SEO</p>
            <div className="space-y-3">
              <div><Label>Meta Title</Label><Input className="mt-1" value={editing.meta_title ?? ""} onChange={(e) => setEditing({ ...editing, meta_title: e.target.value })} /></div>
              <div><Label>Meta Description</Label><Textarea className="mt-1" rows={2} value={editing.meta_description ?? ""} onChange={(e) => setEditing({ ...editing, meta_description: e.target.value })} /></div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button onClick={handleSave} disabled={create.isPending || update.isPending}><Save className="h-4 w-4 mr-2" /> Сохранить</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Отмена</Button>
            {editing.id && <Button variant="destructive" className="ml-auto" onClick={() => { if (confirm("Удалить тег?")) del.mutate({ id: editing.id! }); }}><Trash2 className="h-4 w-4 mr-2" /> Удалить</Button>}
          </div>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{tags.length} тегов</p>
        <Button onClick={() => setEditing({ title: "", slug: "" })}><Plus className="h-4 w-4 mr-2" /> Новый тег</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button key={tag.id} onClick={() => setEditing(tag)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors text-sm font-medium">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            #{tag.title}
          </button>
        ))}
        {tags.length === 0 && (
          <Card className="w-full"><CardContent className="flex flex-col items-center py-12 text-muted-foreground">
            <Tag className="h-12 w-12 mb-3 opacity-30" />
            <p>Тегов пока нет</p>
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// REDIRECTS TAB
// ═════════════════════════════════════════════════════════════════════════════
function RedirectsTab() {
  const utils = trpc.useUtils();
  const [newRedir, setNewRedir] = useState({ from: "", to: "" });

  const { data: redirects = [] } = trpc.knowledge.adminListRedirects.useQuery();
  const create = trpc.knowledge.adminCreateRedirect.useMutation({
    onSuccess: () => { utils.knowledge.adminListRedirects.invalidate(); setNewRedir({ from: "", to: "" }); },
  });
  const del = trpc.knowledge.adminDeleteRedirect.useMutation({
    onSuccess: () => utils.knowledge.adminListRedirects.invalidate(),
  });

  return (
    <div className="space-y-6">
      <Card><CardContent className="pt-5 space-y-3">
        <p className="font-semibold text-sm">Добавить редирект 301</p>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Откуда (старый путь)</Label><Input className="mt-1" placeholder="/knowledge/old-slug" value={newRedir.from} onChange={(e) => setNewRedir({ ...newRedir, from: e.target.value })} /></div>
          <div><Label className="text-xs">Куда (новый путь)</Label><Input className="mt-1" placeholder="/knowledge/new-slug" value={newRedir.to} onChange={(e) => setNewRedir({ ...newRedir, to: e.target.value })} /></div>
        </div>
        <Button size="sm" onClick={() => { if (newRedir.from && newRedir.to) create.mutate({ from_path: newRedir.from, to_path: newRedir.to, status_code: 301 }); }} disabled={create.isPending}>
          <Plus className="h-4 w-4 mr-2" /> Создать редирект
        </Button>
      </CardContent></Card>

      <div className="space-y-2">
        {redirects.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 text-sm min-w-0">
                <span className="shrink-0 px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs font-bold">301</span>
                <code className="text-red-600 truncate">{r.from_path}</code>
                <span className="text-muted-foreground shrink-0">→</span>
                <code className="text-green-600 truncate">{r.to_path}</code>
              </div>
              <button onClick={() => { if (confirm("Удалить редирект?")) del.mutate({ id: r.id }); }} className="text-red-400 hover:text-red-600 shrink-0 ml-4">
                <Trash2 className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        ))}
        {redirects.length === 0 && (
          <Card><CardContent className="flex flex-col items-center py-12 text-muted-foreground">
            <Globe className="h-12 w-12 mb-3 opacity-30" />
            <p>Редиректов пока нет</p>
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// QUESTIONS TAB
// ═════════════════════════════════════════════════════════════════════════════
type KbQuestion = {
  id: string; name: string; email: string | null; question: string;
  topic: string | null; status: "new" | "reviewed" | "published" | "rejected";
  admin_notes: string | null; article_id: string | null;
  created_at: Date; updated_at: Date;
};

const questionStatusLabels: Record<string, { label: string; variant: "default" | "success" | "gray" | "destructive" }> = {
  new: { label: "Новый", variant: "default" },
  reviewed: { label: "Рассмотрен", variant: "gray" },
  published: { label: "Опубликован", variant: "success" },
  rejected: { label: "Отклонён", variant: "destructive" },
};

function QuestionsTab() {
  const utils = trpc.useUtils();
  const [selected, setSelected] = useState<KbQuestion | null>(null);
  const [notes, setNotes] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const { data: questions = [] } = trpc.knowledge.adminListQuestions.useQuery(
    filter !== "all" ? { status: filter as any } : {}
  );

  const updateQ = trpc.knowledge.adminUpdateQuestion.useMutation({
    onSuccess: () => { utils.knowledge.adminListQuestions.invalidate(); setSelected(null); },
  });
  const deleteQ = trpc.knowledge.adminDeleteQuestion.useMutation({
    onSuccess: () => { utils.knowledge.adminListQuestions.invalidate(); setSelected(null); },
  });

  if (selected) {
    return (
      <div className="space-y-6">
        <div>
          <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="h-4 w-4" /> Назад
          </button>
          <PageHeader title="Вопрос от пользователя" />
        </div>
        <Card><CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Имя</Label>
              <p className="font-medium mt-1">{selected.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="font-medium mt-1">{selected.email || "—"}</p>
            </div>
          </div>
          {selected.topic && (
            <div>
              <Label className="text-xs text-muted-foreground">Тема</Label>
              <p className="mt-1">{selected.topic}</p>
            </div>
          )}
          <div>
            <Label className="text-xs text-muted-foreground">Вопрос</Label>
            <p className="mt-1 whitespace-pre-wrap bg-gray-50 rounded-lg p-4 text-sm">{selected.question}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Дата</Label>
            <p className="mt-1 text-sm text-muted-foreground">{new Date(selected.created_at).toLocaleString("ru-RU")}</p>
          </div>
          <div className="border-t pt-4">
            <Label>Заметки администратора</Label>
            <Textarea className="mt-1" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Внутренние заметки..." />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground shrink-0">Статус:</Label>
            <div className="flex gap-2 flex-wrap">
              {(["new", "reviewed", "published", "rejected"] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={selected.status === s ? "default" : "outline"}
                  className="text-xs"
                  onClick={() => {
                    updateQ.mutate({ id: selected.id, status: s, admin_notes: notes || undefined });
                  }}
                  disabled={updateQ.isPending}
                >
                  {questionStatusLabels[s].label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button onClick={() => updateQ.mutate({ id: selected.id, admin_notes: notes || undefined })} disabled={updateQ.isPending}>
              <Save className="h-4 w-4 mr-2" /> Сохранить заметки
            </Button>
            <Button variant="outline" onClick={() => setSelected(null)}>Отмена</Button>
            <Button variant="destructive" className="ml-auto" onClick={() => { if (confirm("Удалить вопрос?")) deleteQ.mutate({ id: selected.id }); }}>
              <Trash2 className="h-4 w-4 mr-2" /> Удалить
            </Button>
          </div>
        </CardContent></Card>
      </div>
    );
  }

  const newCount = questions.filter((q) => q.status === "new").length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {questions.length} вопросов{newCount > 0 ? ` (${newCount} новых)` : ""}
        </p>
        <div className="flex gap-1">
          {[{ value: "all", label: "Все" }, { value: "new", label: "Новые" }, { value: "reviewed", label: "Рассмотрены" }, { value: "rejected", label: "Отклонены" }].map((f) => (
            <Button key={f.value} size="sm" variant={filter === f.value ? "default" : "outline"} className="text-xs" onClick={() => setFilter(f.value)}>
              {f.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {questions.map((q) => {
          const st = questionStatusLabels[q.status];
          return (
            <Card key={q.id} className="hover:border-primary/30 cursor-pointer transition-colors" onClick={() => { setSelected(q as KbQuestion); setNotes(q.admin_notes || ""); }}>
              <CardContent className="flex items-start justify-between p-4 gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <HelpCircle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium line-clamp-2">{q.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {q.name}{q.topic ? ` · ${q.topic}` : ""} · {new Date(q.created_at).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                </div>
                <Badge variant={st.variant as any}>{st.label}</Badge>
              </CardContent>
            </Card>
          );
        })}
        {questions.length === 0 && (
          <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <HelpCircle className="h-12 w-12 mb-3 opacity-30" />
            <p>Вопросов пока нет</p>
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function KnowledgeAdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="База знаний (SEO)"
        description="Управление статьями, категориями, тегами и редиректами"
      />
      <Tabs defaultValue="articles">
        <TabsList>
          <TabsTrigger value="articles"><BookOpen className="h-4 w-4 mr-2" />Статьи</TabsTrigger>
          <TabsTrigger value="categories"><FolderOpen className="h-4 w-4 mr-2" />Категории</TabsTrigger>
          <TabsTrigger value="tags"><Tag className="h-4 w-4 mr-2" />Теги</TabsTrigger>
          <TabsTrigger value="redirects"><Globe className="h-4 w-4 mr-2" />Редиректы</TabsTrigger>
          <TabsTrigger value="questions"><HelpCircle className="h-4 w-4 mr-2" />Вопросы</TabsTrigger>
        </TabsList>
        <TabsContent value="articles" className="mt-6"><ArticlesTab /></TabsContent>
        <TabsContent value="categories" className="mt-6"><CategoriesTab /></TabsContent>
        <TabsContent value="tags" className="mt-6"><TagsTab /></TabsContent>
        <TabsContent value="redirects" className="mt-6"><RedirectsTab /></TabsContent>
        <TabsContent value="questions" className="mt-6"><QuestionsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
