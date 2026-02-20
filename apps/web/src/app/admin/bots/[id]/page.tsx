"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  Bot,
  Eye,
  EyeOff,
  Plus,
  X,
  FileCode,
  Copy,
  Check,
} from "lucide-react";

export default function BotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;

  const utils = trpc.useUtils();
  const { data: bot, isLoading } = trpc.bots.getById.useQuery({ id: botId });
  const updateMutation = trpc.bots.update.useMutation({
    onSuccess: () => {
      utils.bots.getById.invalidate({ id: botId });
      utils.bots.list.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });
  const { data: generatedConfig } = trpc.bots.generateConfig.useQuery(
    { id: botId },
    { enabled: !!bot }
  );

  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [modelPrimary, setModelPrimary] = useState("");
  const [modelFallbacks, setModelFallbacks] = useState<string[]>([]);
  const [newFallback, setNewFallback] = useState("");
  const [heartbeat, setHeartbeat] = useState("");
  const [soulMd, setSoulMd] = useState("");
  const [agentsMd, setAgentsMd] = useState("");
  const [extraEnv, setExtraEnv] = useState<Record<string, string>>({});
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");

  // Initialize form from bot data
  useEffect(() => {
    if (bot) {
      setName(bot.name);
      setDescription(bot.description || "");
      setTelegramToken(bot.telegram_bot_token || "");
      setTelegramUsername(bot.telegram_bot_username || "");
      setOpenrouterKey(bot.openrouter_api_key || "");
      setModelPrimary(bot.model_primary);
      setModelFallbacks((bot.model_fallbacks as string[]) || []);
      setHeartbeat(bot.heartbeat_interval || "");
      setSoulMd(bot.soul_md || "");
      setAgentsMd(bot.agents_md || "");
      setExtraEnv((bot.extra_env as Record<string, string>) || {});
    }
  }, [bot]);

  const handleSave = (fields: Record<string, any>) => {
    updateMutation.mutate({ id: botId, ...fields });
  };

  const handleSaveGeneral = () => {
    handleSave({
      name,
      description: description || undefined,
      telegram_bot_token: telegramToken || undefined,
      telegram_bot_username: telegramUsername || undefined,
    });
  };

  const handleSaveModel = () => {
    handleSave({
      openrouter_api_key: openrouterKey || undefined,
      model_primary: modelPrimary,
      model_fallbacks: modelFallbacks,
      heartbeat_interval: heartbeat || undefined,
    });
  };

  const handleSavePrompt = () => {
    handleSave({ soul_md: soulMd });
  };

  const handleSaveInstructions = () => {
    handleSave({ agents_md: agentsMd });
  };

  const handleSaveEnv = () => {
    handleSave({ extra_env: extraEnv });
  };

  const addFallback = () => {
    if (newFallback && !modelFallbacks.includes(newFallback)) {
      setModelFallbacks([...modelFallbacks, newFallback]);
      setNewFallback("");
    }
  };

  const removeFallback = (idx: number) => {
    setModelFallbacks(modelFallbacks.filter((_, i) => i !== idx));
  };

  const addEnvVar = () => {
    if (newEnvKey && !extraEnv[newEnvKey]) {
      setExtraEnv({ ...extraEnv, [newEnvKey]: newEnvValue });
      setNewEnvKey("");
      setNewEnvValue("");
    }
  };

  const removeEnvVar = (key: string) => {
    const next = { ...extraEnv };
    delete next[key];
    setExtraEnv(next);
  };

  const copyConfig = async () => {
    if (generatedConfig) {
      await navigator.clipboard.writeText(generatedConfig.openclawJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const maskToken = (token: string) => {
    if (!token) return "";
    if (token.length <= 8) return "****";
    return token.substring(0, 4) + "****" + token.substring(token.length - 4);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-white rounded-xl border border-gray-200 animate-pulse" />
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="space-y-6">
        <PageHeader title="Бот не найден" />
        <Link href="/admin/bots">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к списку
          </Button>
        </Link>
      </div>
    );
  }

  const popularModels = [
    "openrouter/deepseek/deepseek-r1-0528",
    "openrouter/deepseek/deepseek-r1",
    "openrouter/anthropic/claude-sonnet-4",
    "openrouter/anthropic/claude-haiku-4",
    "openrouter/google/gemini-2.5-flash",
    "openrouter/google/gemini-2.5-pro",
    "openrouter/openai/gpt-4o",
    "openrouter/openai/gpt-4o-mini",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/bots">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader title={bot.name} description={`/${bot.slug}`}>
          <Badge variant={bot.is_enabled ? "success" : "gray"}>
            {bot.is_enabled ? "Активен" : "Выключен"}
          </Badge>
        </PageHeader>
      </div>

      {saved && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
          <Check className="h-4 w-4" /> Сохранено
        </div>
      )}

      {updateMutation.error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {updateMutation.error.message}
        </div>
      )}

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Основное</TabsTrigger>
          <TabsTrigger value="model">Модель</TabsTrigger>
          <TabsTrigger value="prompt">Промпт (SOUL.md)</TabsTrigger>
          <TabsTrigger value="instructions">Инструкции (AGENTS.md)</TabsTrigger>
          <TabsTrigger value="env">Переменные</TabsTrigger>
          <TabsTrigger value="config">Конфиг</TabsTrigger>
        </TabsList>

        {/* === General tab === */}
        <TabsContent value="general">
          <div className="max-w-xl p-6 rounded-xl border border-gray-200 bg-white space-y-4">
            <div className="space-y-2">
              <Label>Название бота</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание назначения бота"
              />
            </div>
            <div className="space-y-2">
              <Label>Telegram Bot Token</Label>
              <div className="flex gap-2">
                <Input
                  type={showToken ? "text" : "password"}
                  value={showToken ? telegramToken : maskToken(telegramToken)}
                  onChange={(e) => {
                    if (showToken) setTelegramToken(e.target.value);
                  }}
                  onFocus={() => setShowToken(true)}
                  placeholder="123456:ABC-DEF..."
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowToken(!showToken)}
                  className="shrink-0"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Telegram Username</Label>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">@</span>
                <Input
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  placeholder="MyBot"
                />
              </div>
            </div>
            <Button onClick={handleSaveGeneral} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </TabsContent>

        {/* === Model tab === */}
        <TabsContent value="model">
          <div className="max-w-xl p-6 rounded-xl border border-gray-200 bg-white space-y-4">
            <div className="space-y-2">
              <Label>OpenRouter API Key</Label>
              <div className="flex gap-2">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={showApiKey ? openrouterKey : maskToken(openrouterKey)}
                  onChange={(e) => {
                    if (showApiKey) setOpenrouterKey(e.target.value);
                  }}
                  onFocus={() => setShowApiKey(true)}
                  placeholder="sk-or-..."
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="shrink-0"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Основная модель</Label>
              <Input
                value={modelPrimary}
                onChange={(e) => setModelPrimary(e.target.value)}
                placeholder="openrouter/deepseek/deepseek-r1-0528"
                className="font-mono text-sm"
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {popularModels.map((m) => (
                  <button
                    key={m}
                    onClick={() => setModelPrimary(m)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      modelPrimary === m
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {m.split("/").slice(-1)[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fallback модели</Label>
              {modelFallbacks.map((fb, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={fb}
                    readOnly
                    className="font-mono text-sm bg-gray-50"
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeFallback(idx)}>
                    <X className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newFallback}
                  onChange={(e) => setNewFallback(e.target.value)}
                  placeholder="openrouter/deepseek/deepseek-r1"
                  className="font-mono text-sm"
                  onKeyDown={(e) => e.key === "Enter" && addFallback()}
                />
                <Button variant="outline" size="sm" onClick={addFallback} disabled={!newFallback}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Heartbeat интервал</Label>
              <Input
                value={heartbeat}
                onChange={(e) => setHeartbeat(e.target.value)}
                placeholder="24h (пусто = без heartbeat)"
              />
              <p className="text-xs text-gray-400">Примеры: 30m, 1h, 24h, 7d</p>
            </div>

            <Button onClick={handleSaveModel} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </TabsContent>

        {/* === Prompt (SOUL.md) tab === */}
        <TabsContent value="prompt">
          <div className="p-6 rounded-xl border border-gray-200 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">SOUL.md — Личность бота</h3>
                <p className="text-sm text-gray-500">
                  Определяет характер, стиль общения и экспертизу бота
                </p>
              </div>
              <Badge variant="info">Markdown</Badge>
            </div>
            <Textarea
              value={soulMd}
              onChange={(e) => setSoulMd(e.target.value)}
              placeholder={`# Личность — Название роли\n\nОписание персоны бота.\n\n## Характер\n- Свойство 1\n- Свойство 2\n\n## Стиль общения\n- Коротко если вопрос простой\n- Развёрнуто если тема сложная`}
              className="font-mono text-sm min-h-[400px]"
            />
            <Button onClick={handleSavePrompt} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </TabsContent>

        {/* === Instructions (AGENTS.md) tab === */}
        <TabsContent value="instructions">
          <div className="p-6 rounded-xl border border-gray-200 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">AGENTS.md — Инструкции</h3>
                <p className="text-sm text-gray-500">
                  Операционные инструкции: доступ к API, алгоритм работы, ограничения
                </p>
              </div>
              <Badge variant="info">Markdown</Badge>
            </div>
            <Textarea
              value={agentsMd}
              onChange={(e) => setAgentsMd(e.target.value)}
              placeholder={`# Инструкции — Название Agent\n\n## Доступ к API\nБазовый URL: ...\n\n## Алгоритм работы\n1. Шаг 1\n2. Шаг 2\n\n## Ограничения\n- Ограничение 1`}
              className="font-mono text-sm min-h-[400px]"
            />
            <Button onClick={handleSaveInstructions} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </TabsContent>

        {/* === Environment variables tab === */}
        <TabsContent value="env">
          <div className="max-w-xl p-6 rounded-xl border border-gray-200 bg-white space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">Переменные окружения</h3>
              <p className="text-sm text-gray-500">
                Дополнительные ENV-переменные для контейнера бота
              </p>
            </div>

            {Object.entries(extraEnv).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <Input value={key} readOnly className="font-mono text-sm bg-gray-50 w-1/3" />
                <Input
                  value={value}
                  onChange={(e) => setExtraEnv({ ...extraEnv, [key]: e.target.value })}
                  className="font-mono text-sm"
                />
                <Button variant="ghost" size="sm" onClick={() => removeEnvVar(key)}>
                  <X className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            ))}

            <div className="flex gap-2">
              <Input
                value={newEnvKey}
                onChange={(e) => setNewEnvKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                placeholder="KEY_NAME"
                className="font-mono text-sm w-1/3"
              />
              <Input
                value={newEnvValue}
                onChange={(e) => setNewEnvValue(e.target.value)}
                placeholder="value"
                className="font-mono text-sm"
                onKeyDown={(e) => e.key === "Enter" && addEnvVar()}
              />
              <Button variant="outline" size="sm" onClick={addEnvVar} disabled={!newEnvKey}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button onClick={handleSaveEnv} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </TabsContent>

        {/* === Generated config tab === */}
        <TabsContent value="config">
          <div className="p-6 rounded-xl border border-gray-200 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Сгенерированный openclaw.json</h3>
                <p className="text-sm text-gray-500">
                  Итоговый конфиг, который используется ботом. Только для чтения.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={copyConfig}>
                {copied ? (
                  <><Check className="h-4 w-4 mr-1" /> Скопировано</>
                ) : (
                  <><Copy className="h-4 w-4 mr-1" /> Копировать</>
                )}
              </Button>
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <FileCode className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500 font-mono">openclaw.json</span>
              </div>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre">
                {generatedConfig?.openclawJson || "Загрузка..."}
              </pre>
            </div>

            {generatedConfig?.soulMd && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileCode className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500 font-mono">workspace/SOUL.md</span>
                </div>
                <pre className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap text-gray-700">
                  {generatedConfig.soulMd}
                </pre>
              </div>
            )}

            {generatedConfig?.agentsMd && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileCode className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500 font-mono">workspace/AGENTS.md</span>
                </div>
                <pre className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap text-gray-700">
                  {generatedConfig.agentsMd}
                </pre>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
