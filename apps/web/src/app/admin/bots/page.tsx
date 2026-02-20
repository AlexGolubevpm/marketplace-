"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Bot,
  Plus,
  RefreshCw,
  Settings2,
  Power,
  PowerOff,
  Cpu,
  MessageSquare,
  Clock,
} from "lucide-react";

export default function BotsPage() {
  const utils = trpc.useUtils();
  const { data: bots, isLoading } = trpc.bots.list.useQuery();
  const toggleMutation = trpc.bots.toggleEnabled.useMutation({
    onSuccess: () => utils.bots.list.invalidate(),
  });
  const createMutation = trpc.bots.create.useMutation({
    onSuccess: () => {
      utils.bots.list.invalidate();
      setShowCreate(false);
      setForm({ name: "", slug: "", description: "" });
    },
  });
  const deleteMutation = trpc.bots.delete.useMutation({
    onSuccess: () => utils.bots.list.invalidate(),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });

  const handleCreate = () => {
    if (!form.name || !form.slug) return;
    createMutation.mutate({
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Удалить бота "${name}"? Это действие нельзя отменить.`)) return;
    deleteMutation.mutate({ id });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="AI Боты" description="Управление OpenClaw ботами">
        <Button variant="outline" size="sm" onClick={() => utils.bots.list.invalidate()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Обновить
        </Button>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить бота
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-white animate-pulse border border-gray-200" />
          ))}
        </div>
      ) : !bots || bots.length === 0 ? (
        <EmptyState
          title="Нет ботов"
          description="Добавьте первого AI-бота для управления"
          actionLabel="Добавить бота"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${bot.is_enabled ? "bg-green-50" : "bg-gray-100"}`}>
                    <Bot className={`h-5 w-5 ${bot.is_enabled ? "text-green-600" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{bot.name}</h3>
                    <p className="text-xs text-gray-400">/{bot.slug}</p>
                  </div>
                </div>
                <Badge variant={bot.is_enabled ? "success" : "gray"}>
                  {bot.is_enabled ? "Активен" : "Выключен"}
                </Badge>
              </div>

              {bot.description && (
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{bot.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Cpu className="h-3.5 w-3.5" />
                  <span className="truncate">{bot.model_primary}</span>
                </div>
                {bot.telegram_bot_username && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>@{bot.telegram_bot_username}</span>
                  </div>
                )}
                {bot.heartbeat_interval && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Heartbeat: {bot.heartbeat_interval}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <Link href={`/admin/bots/${bot.id}`}>
                  <Button variant="outline" size="sm">
                    <Settings2 className="h-4 w-4 mr-1" />
                    Настроить
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleMutation.mutate({ id: bot.id })}
                  disabled={toggleMutation.isPending}
                >
                  {bot.is_enabled ? (
                    <>
                      <PowerOff className="h-4 w-4 mr-1 text-orange-500" />
                      <span className="text-orange-500">Выключить</span>
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4 mr-1 text-green-500" />
                      <span className="text-green-500">Включить</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-red-400 hover:text-red-600"
                  onClick={() => handleDelete(bot.id, bot.name)}
                >
                  Удалить
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить AI-бота</DialogTitle>
            <DialogDescription>Создайте нового OpenClaw бота</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название *</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const slug = form.slug || name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
                  setForm({ ...form, name, slug });
                }}
                placeholder="Content Manager"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                placeholder="content"
              />
              <p className="text-xs text-gray-400">Уникальный идентификатор (латиница, цифры, дефисы)</p>
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Публикует статьи в базу знаний"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Отмена</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending || !form.name || !form.slug}>
              {createMutation.isPending ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
