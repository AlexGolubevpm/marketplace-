"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Save,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  ChevronRight,
  BookOpen,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { trpc } from "@/trpc/client";

type Section = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_published: boolean;
};

type Article = {
  id: string;
  section_id: string;
  slug: string;
  title: string;
  content: string;
  sort_order: number;
  is_published: boolean;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[а-яё]/g, (ch) => {
      const map: Record<string, string> = {
        а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
        з: "z", и: "i", й: "j", к: "k", л: "l", м: "m", н: "n", о: "o",
        п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
        ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
      };
      return map[ch] || ch;
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function KnowledgeBasePage() {
  const [view, setView] = useState<"sections" | "articles">("sections");
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [editingSection, setEditingSection] = useState<Partial<Section> | null>(null);
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);

  const utils = trpc.useUtils();
  const sectionsQuery = trpc.knowledgebase.listSections.useQuery();
  const articlesQuery = trpc.knowledgebase.listArticles.useQuery(
    { sectionId: activeSection?.id ?? "" },
    { enabled: !!activeSection }
  );

  const createSection = trpc.knowledgebase.createSection.useMutation({
    onSuccess: () => { utils.knowledgebase.listSections.invalidate(); setEditingSection(null); },
  });
  const updateSection = trpc.knowledgebase.updateSection.useMutation({
    onSuccess: () => { utils.knowledgebase.listSections.invalidate(); setEditingSection(null); },
  });
  const deleteSection = trpc.knowledgebase.deleteSection.useMutation({
    onSuccess: () => { utils.knowledgebase.listSections.invalidate(); setActiveSection(null); setView("sections"); },
  });

  const createArticle = trpc.knowledgebase.createArticle.useMutation({
    onSuccess: () => { utils.knowledgebase.listArticles.invalidate(); setEditingArticle(null); },
  });
  const updateArticle = trpc.knowledgebase.updateArticle.useMutation({
    onSuccess: () => { utils.knowledgebase.listArticles.invalidate(); setEditingArticle(null); },
  });
  const deleteArticle = trpc.knowledgebase.deleteArticle.useMutation({
    onSuccess: () => { utils.knowledgebase.listArticles.invalidate(); setEditingArticle(null); },
  });

  const sections = sectionsQuery.data ?? [];
  const articles = articlesQuery.data ?? [];

  function handleSaveSection() {
    if (!editingSection?.title) return;
    const slug = editingSection.slug || slugify(editingSection.title);
    if (editingSection.id) {
      updateSection.mutate({ id: editingSection.id, title: editingSection.title, slug, description: editingSection.description ?? undefined, icon: editingSection.icon ?? undefined, sort_order: editingSection.sort_order, is_published: editingSection.is_published });
    } else {
      createSection.mutate({ title: editingSection.title, slug, description: editingSection.description ?? undefined, icon: editingSection.icon ?? undefined, sort_order: editingSection.sort_order ?? sections.length });
    }
  }

  function handleSaveArticle() {
    if (!editingArticle?.title || !editingArticle?.content || !activeSection) return;
    const slug = editingArticle.slug || slugify(editingArticle.title);
    if (editingArticle.id) {
      updateArticle.mutate({ id: editingArticle.id, title: editingArticle.title, slug, content: editingArticle.content, sort_order: editingArticle.sort_order, is_published: editingArticle.is_published });
    } else {
      createArticle.mutate({ section_id: activeSection.id, title: editingArticle.title, slug, content: editingArticle.content, sort_order: editingArticle.sort_order ?? articles.length });
    }
  }

  // Sections list view
  if (view === "sections" && !editingSection) {
    return (
      <div className="space-y-6">
        <PageHeader title="База знаний" description="Разделы и статьи для клиентов" />
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">{sections.length} разделов</p>
          <Button onClick={() => setEditingSection({ title: "", slug: "", description: "", sort_order: sections.length })}>
            <Plus className="h-4 w-4 mr-2" /> Новый раздел
          </Button>
        </div>
        <div className="space-y-2">
          {sections.map((s) => (
            <Card key={s.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => { setActiveSection(s); setView("articles"); }}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-medium">{s.title}</p>
                    {s.description && <p className="text-sm text-muted-foreground line-clamp-1">{s.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={s.is_published ? "success" : "gray"}>{s.is_published ? "Опубликован" : "Черновик"}</Badge>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingSection(s); }}>
                    Изменить
                  </Button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
          {sections.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mb-3 opacity-30" />
                <p>Разделов пока нет</p>
                <p className="text-sm">Создайте первый раздел базы знаний</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Section editor
  if (editingSection) {
    return (
      <div className="space-y-6">
        <PageHeader title={editingSection.id ? "Редактировать раздел" : "Новый раздел"} description="Настройте название и описание раздела" />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label>Название раздела</Label>
              <Input className="mt-1" value={editingSection.title ?? ""} onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value, slug: editingSection.slug || slugify(e.target.value) })} placeholder="Например: Документы для импорта" />
            </div>
            <div>
              <Label>Slug (URL)</Label>
              <Input className="mt-1" value={editingSection.slug ?? ""} onChange={(e) => setEditingSection({ ...editingSection, slug: e.target.value })} placeholder="dokumenty-dlya-importa" />
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea className="mt-1" rows={3} value={editingSection.description ?? ""} onChange={(e) => setEditingSection({ ...editingSection, description: e.target.value })} placeholder="Краткое описание раздела" />
            </div>
            <div>
              <Label>Порядок сортировки</Label>
              <Input className="mt-1" type="number" value={editingSection.sort_order ?? 0} onChange={(e) => setEditingSection({ ...editingSection, sort_order: parseInt(e.target.value) || 0 })} />
            </div>
            {editingSection.id && (
              <div className="flex items-center gap-2">
                <Label>Опубликован</Label>
                <button onClick={() => setEditingSection({ ...editingSection, is_published: !editingSection.is_published })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editingSection.is_published ? "bg-cyan-500" : "bg-white/10"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editingSection.is_published ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 pt-4 border-t">
              <Button onClick={handleSaveSection} disabled={createSection.isPending || updateSection.isPending}>
                <Save className="h-4 w-4 mr-2" /> Сохранить
              </Button>
              <Button variant="outline" onClick={() => setEditingSection(null)}>Отмена</Button>
              {editingSection.id && (
                <Button variant="destructive" className="ml-auto" onClick={() => { if (confirm("Удалить раздел и все статьи?")) deleteSection.mutate({ id: editingSection.id! }); }}>
                  <Trash2 className="h-4 w-4 mr-2" /> Удалить
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Articles list view
  if (view === "articles" && activeSection && !editingArticle) {
    return (
      <div className="space-y-6">
        <div>
          <button onClick={() => { setView("sections"); setActiveSection(null); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-4 w-4" /> Все разделы
          </button>
          <PageHeader title={activeSection.title} description={activeSection.description || "Статьи раздела"} />
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">{articles.length} статей</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditingSection(activeSection)}>Изменить раздел</Button>
            <Button onClick={() => setEditingArticle({ title: "", slug: "", content: "", sort_order: articles.length })}>
              <Plus className="h-4 w-4 mr-2" /> Новая статья
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {articles.map((a) => (
            <Card key={a.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setEditingArticle(a)}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-white/30" />
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{a.content.substring(0, 100)}...</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.is_published ? "success" : "gray"}>{a.is_published ? "Опубл." : "Черновик"}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {articles.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mb-3 opacity-30" />
                <p>Статей пока нет</p>
                <p className="text-sm">Добавьте первую статью в этот раздел</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Article editor
  if (editingArticle) {
    return (
      <div className="space-y-6">
        <div>
          <button onClick={() => setEditingArticle(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-4 w-4" /> Назад к статьям
          </button>
          <PageHeader title={editingArticle.id ? "Редактировать статью" : "Новая статья"} description={activeSection?.title} />
        </div>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label>Заголовок</Label>
              <Input className="mt-1" value={editingArticle.title ?? ""} onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value, slug: editingArticle.slug || slugify(e.target.value) })} placeholder="Заголовок статьи" />
            </div>
            <div>
              <Label>Slug (URL)</Label>
              <Input className="mt-1" value={editingArticle.slug ?? ""} onChange={(e) => setEditingArticle({ ...editingArticle, slug: e.target.value })} />
            </div>
            <div>
              <Label>Содержимое</Label>
              <Textarea className="mt-1 font-mono text-sm" rows={15} value={editingArticle.content ?? ""} onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })} placeholder="Текст статьи. Поддерживается разметка с переносами строк." />
            </div>
            <div>
              <Label>Порядок сортировки</Label>
              <Input className="mt-1" type="number" value={editingArticle.sort_order ?? 0} onChange={(e) => setEditingArticle({ ...editingArticle, sort_order: parseInt(e.target.value) || 0 })} />
            </div>
            {editingArticle.id && (
              <div className="flex items-center gap-2">
                <Label>Опубликована</Label>
                <button onClick={() => setEditingArticle({ ...editingArticle, is_published: !editingArticle.is_published })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editingArticle.is_published ? "bg-cyan-500" : "bg-white/10"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editingArticle.is_published ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 pt-4 border-t">
              <Button onClick={handleSaveArticle} disabled={createArticle.isPending || updateArticle.isPending}>
                <Save className="h-4 w-4 mr-2" /> Сохранить
              </Button>
              <Button variant="outline" onClick={() => setEditingArticle(null)}>Отмена</Button>
              {editingArticle.id && (
                <Button variant="destructive" className="ml-auto" onClick={() => { if (confirm("Удалить статью?")) deleteArticle.mutate({ id: editingArticle.id! }); }}>
                  <Trash2 className="h-4 w-4 mr-2" /> Удалить
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
