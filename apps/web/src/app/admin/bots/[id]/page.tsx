"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  Eye,
  EyeOff,
  Plus,
  X,
  FileCode,
  Copy,
  Check,
  Webhook,
  RefreshCw,
  Trash2,
  MessageSquare,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type Skill = {
  name: string;
  description: string;
  triggers: string[];
  code: string;
};

export default function BotDetailPage() {
  const params = useParams();
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
  const { data: generatedConfig, refetch: refetchConfig } = trpc.bots.generateConfig.useQuery(
    { id: botId },
    { enabled: !!bot }
  );
  const { data: webhookInfo, refetch: refetchWebhook } = trpc.bots.getWebhookInfo.useQuery(
    { id: botId },
    { enabled: !!bot }
  );
  const { data: logs, refetch: refetchLogs } = trpc.bots.getLogs.useQuery(
    { bot_id: botId, limit: 100 },
    { enabled: !!bot }
  );

  const setWebhookMutation = trpc.bots.setWebhook.useMutation({
    onSuccess: () => {
      refetchWebhook();
      setWebhookResult({ ok: true, message: "Webhook успешно установлен" });
    },
    onError: (e) => {
      setWebhookResult({ ok: false, message: e.message });
    },
  });

  const clearLogsMutation = trpc.bots.clearLogs.useMutation({
    onSuccess: () => refetchLogs(),
  });

  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // General
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [showToken, setShowToken] = useState(false);

  // Model
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [modelPrimary, setModelPrimary] = useState("");
  const [modelFallbacks, setModelFallbacks] = useState<string[]>([]);
  const [newFallback, setNewFallback] = useState("");
  const [heartbeat, setHeartbeat] = useState("");
  const [maxTokens, setMaxTokens] = useState<string>("");
  const [temperature, setTemperature] = useState<string>("");

  // Prompts
  const [soulMd, setSoulMd] = useState("");
  const [agentsMd, setAgentsMd] = useState("");

  // Skills
  const [skills, setSkills] = useState<Skill[]>([]);
  const [expandedSkill, setExpandedSkill] = useState<number | null>(null);

  // Env
  const [extraEnv, setExtraEnv] = useState<Record<string, string>>({});
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");

  // Webhook
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookResult, setWebhookResult] = useState<{ ok: boolean; message: string } | null>(null);

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
      setMaxTokens(bot.max_tokens != null ? String(bot.max_tokens) : "");
      setTemperature(bot.temperature != null ? String(bot.temperature) : "");
      setSoulMd(bot.soul_md || "");
      setAgentsMd(bot.agents_md || "");
      setSkills((bot.skills as Skill[]) || []);
      setExtraEnv((bot.extra_env as Record<string, string>) || {});
      setWebhookUrl((bot as any).webhook_url || "");
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
      max_tokens: maxTokens ? parseInt(maxTokens, 10) : null,
      temperature: temperature !== "" ? parseFloat(temperature) : null,
    });
  };

  const handleSavePrompt = () => handleSave({ soul_md: soulMd });
  const handleSaveInstructions = () => handleSave({ agents_md: agentsMd });
  const handleSaveSkills = () => handleSave({ skills });
  const handleSaveEnv = () => handleSave({ extra_env: extraEnv });

  const addFallback = () => {
    if (newFallback && !modelFallbacks.includes(newFallback)) {
      setModelFallbacks([...modelFallbacks, newFallback]);
      setNewFallback("");
    }
  };

  const addEnvVar = () => {
    if (newEnvKey && !extraEnv[newEnvKey]) {
      setExtraEnv({ ...extraEnv, [newEnvKey]: newEnvValue });
      setNewEnvKey("");
      setNewEnvValue("");
    }
  };

  const addSkill = () => {
    const newSkill: Skill = {
      name: `skill-${skills.length + 1}`,
      description: "",
      triggers: ["/skill"],
      code: `export const meta = {\n  name: "skill-${skills.length + 1}",\n  description: "",\n  triggers: ["/skill"],\n};\n\nexport async function run({ message, llm, http, reply, env }) {\n  await reply("Hello!");\n}\n`,
    };
    setSkills([...skills, newSkill]);
    setExpandedSkill(skills.length);
  };

  const updateSkill = (idx: number, patch: Partial<Skill>) => {
    setSkills(skills.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const removeSkill = (idx: number) => {
    setSkills(skills.filter((_, i) => i !== idx));
    setExpandedSkill(null);
  };

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const maskToken = (token: string) => {
    if (!token) return "";
    if (token.length <= 8) return "****";
    return token.substring(0, 4) + "****" + token.substring(token.length - 4);
  };

  const handleSetWebhook = () => {
    if (!webhookUrl) return;
    setWebhookResult(null);
    setWebhookMutation.mutate({ id: botId, webhook_url: webhookUrl });
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
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">Основное</TabsTrigger>
          <TabsTrigger value="model">Модель</TabsTrigger>
          <TabsTrigger value="prompt">SOUL.md</TabsTrigger>
          <TabsTrigger value="instructions">AGENTS.md</TabsTrigger>
          <TabsTrigger value="skills">Навыки</TabsTrigger>
          <TabsTrigger value="env">Переменные</TabsTrigger>
          <TabsTrigger value="webhook">Webhook</TabsTrigger>
          <TabsTrigger value="logs">
            Логи {logs && logs.length > 0 && <span className="ml-1 text-xs text-gray-400">({logs.length})</span>}
          </TabsTrigger>
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
                  onChange={(e) => { if (showToken) setTelegramToken(e.target.value); }}
                  onFocus={() => setShowToken(true)}
                  placeholder="123456:ABC-DEF..."
                  className="font-mono"
                />
                <Button variant="outline" size="sm" onClick={() => setShowToken(!showToken)} className="shrink-0">
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
                  onChange={(e) => { if (showApiKey) setOpenrouterKey(e.target.value); }}
                  onFocus={() => setShowApiKey(true)}
                  placeholder="sk-or-..."
                  className="font-mono"
                />
                <Button variant="outline" size="sm" onClick={() => setShowApiKey(!showApiKey)} className="shrink-0">
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
                  <Input value={fb} readOnly className="font-mono text-sm bg-gray-50" />
                  <Button variant="ghost" size="sm" onClick={() => setModelFallbacks(modelFallbacks.filter((_, i) => i !== idx))}>
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

            {/* max_tokens + temperature */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Tokens</Label>
                <Input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                  placeholder="31000"
                  min={1}
                  max={200000}
                />
                <p className="text-xs text-gray-400">Контекстное окно ответа. Пусто = дефолт модели</p>
              </div>
              <div className="space-y-2">
                <Label>Temperature</Label>
                <Input
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="0.7"
                  min={0}
                  max={2}
                  step={0.1}
                />
                <p className="text-xs text-gray-400">0 — точный, 1 — творческий, 2 — максимум</p>
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
                <p className="text-sm text-gray-500">Определяет характер, стиль общения и экспертизу бота</p>
              </div>
              <Badge variant="info">Markdown</Badge>
            </div>
            <Textarea
              value={soulMd}
              onChange={(e) => setSoulMd(e.target.value)}
              placeholder={`# Личность — Название роли\n\n## Характер\n- ...\n\n## Стиль общения\n- Коротко если вопрос простой`}
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
                <p className="text-sm text-gray-500">Операционные инструкции: доступ к API, алгоритм работы, ограничения</p>
              </div>
              <Badge variant="info">Markdown</Badge>
            </div>
            <Textarea
              value={agentsMd}
              onChange={(e) => setAgentsMd(e.target.value)}
              placeholder={`# Инструкции — Agent\n\n## Доступ к API\nБазовый URL: ...\n\n## Алгоритм работы\n1. Шаг 1`}
              className="font-mono text-sm min-h-[400px]"
            />
            <Button onClick={handleSaveInstructions} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </TabsContent>

        {/* === Skills tab === */}
        <TabsContent value="skills">
          <div className="p-6 rounded-xl border border-gray-200 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Навыки (Skills)</h3>
                <p className="text-sm text-gray-500">
                  JS-скрипты, расширяющие возможности бота. Каждый навык запускается по команде-триггеру.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addSkill}>
                <Plus className="h-4 w-4 mr-1" /> Добавить навык
              </Button>
            </div>

            {skills.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
                Нет навыков. Добавьте первый навык, чтобы расширить возможности бота.
              </div>
            )}

            {skills.map((skill, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setExpandedSkill(expandedSkill === idx ? null : idx)}
                >
                  <div className="flex items-center gap-3">
                    <FileCode className="h-4 w-4 text-gray-400" />
                    <span className="font-mono text-sm font-medium">{skill.name || "Без названия"}</span>
                    <div className="flex gap-1">
                      {skill.triggers.map((t, ti) => (
                        <span key={ti} className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded font-mono">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); removeSkill(idx); }}
                    >
                      <X className="h-4 w-4 text-red-400" />
                    </Button>
                    {expandedSkill === idx ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                {expandedSkill === idx && (
                  <div className="p-4 space-y-3 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Название (имя файла)</Label>
                        <Input
                          value={skill.name}
                          onChange={(e) => updateSkill(idx, { name: e.target.value.replace(/[^a-z0-9-]/g, "") })}
                          placeholder="my-skill"
                          className="font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Триггеры (через запятую)</Label>
                        <Input
                          value={skill.triggers.join(", ")}
                          onChange={(e) => updateSkill(idx, { triggers: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                          placeholder="/cmd1, /cmd2"
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Описание</Label>
                      <Input
                        value={skill.description}
                        onChange={(e) => updateSkill(idx, { description: e.target.value })}
                        placeholder="Что делает этот навык..."
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Код (JavaScript ES module)</Label>
                        <button
                          onClick={() => copyText(skill.code, `skill-${idx}`)}
                          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                        >
                          {copied === `skill-${idx}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copied === `skill-${idx}` ? "Скопировано" : "Копировать"}
                        </button>
                      </div>
                      <Textarea
                        value={skill.code}
                        onChange={(e) => updateSkill(idx, { code: e.target.value })}
                        className="font-mono text-xs min-h-[200px] bg-gray-950 text-green-400 border-gray-700"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {skills.length > 0 && (
              <Button onClick={handleSaveSkills} disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Сохранение..." : "Сохранить навыки"}
              </Button>
            )}
          </div>
        </TabsContent>

        {/* === Environment variables tab === */}
        <TabsContent value="env">
          <div className="max-w-xl p-6 rounded-xl border border-gray-200 bg-white space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">Переменные окружения</h3>
              <p className="text-sm text-gray-500">Дополнительные ENV-переменные для контейнера бота</p>
            </div>

            {Object.entries(extraEnv).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <Input value={key} readOnly className="font-mono text-sm bg-gray-50 w-1/3" />
                <Input
                  value={value}
                  onChange={(e) => setExtraEnv({ ...extraEnv, [key]: e.target.value })}
                  className="font-mono text-sm"
                />
                <Button variant="ghost" size="sm" onClick={() => { const n = { ...extraEnv }; delete n[key]; setExtraEnv(n); }}>
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

        {/* === Webhook tab === */}
        <TabsContent value="webhook">
          <div className="max-w-xl p-6 rounded-xl border border-gray-200 bg-white space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900">Telegram Webhook</h3>
              <p className="text-sm text-gray-500">
                Укажите URL и нажмите «Установить» — бот зарегистрирует webhook в Telegram.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-domain.com/api/bot/webhook"
                  className="font-mono text-sm"
                />
                <Button
                  onClick={handleSetWebhook}
                  disabled={!webhookUrl || setWebhookMutation.isPending}
                  className="shrink-0"
                >
                  <Webhook className="h-4 w-4 mr-2" />
                  {setWebhookMutation.isPending ? "Устанавливаю..." : "Установить"}
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                Должен быть публичный HTTPS URL. Для локальной разработки используйте ngrok или аналог.
              </p>
            </div>

            {webhookResult && (
              <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                webhookResult.ok
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-600"
              }`}>
                {webhookResult.ok ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {webhookResult.message}
              </div>
            )}

            {/* Current webhook info from Telegram */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">Текущий статус webhook</h4>
                <Button variant="ghost" size="sm" onClick={() => refetchWebhook()}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>

              {webhookInfo === undefined && (
                <p className="text-sm text-gray-400">Загрузка...</p>
              )}
              {webhookInfo === null && (
                <p className="text-sm text-gray-400">Нет данных (укажите Telegram Bot Token в настройках)</p>
              )}
              {webhookInfo && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 shrink-0 w-32">URL:</span>
                    <span className="font-mono text-xs break-all">{webhookInfo.url || "не установлен"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 shrink-0 w-32">Ожидает обновлений:</span>
                    <span>{webhookInfo.pending_update_count}</span>
                  </div>
                  {webhookInfo.last_error_message && (
                    <div className="flex items-start gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span className="text-xs">{webhookInfo.last_error_message}</span>
                    </div>
                  )}
                  {!webhookInfo.last_error_message && webhookInfo.url && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="h-4 w-4" />
                      <span>Webhook активен</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* === Logs tab === */}
        <TabsContent value="logs">
          <div className="p-6 rounded-xl border border-gray-200 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">История сообщений</h3>
                <p className="text-sm text-gray-500">Последние 100 входящих и исходящих сообщений бота</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => refetchLogs()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearLogsMutation.mutate({ bot_id: botId })}
                  disabled={clearLogsMutation.isPending || !logs?.length}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Очистить
                </Button>
              </div>
            </div>

            {!logs?.length && (
              <div className="text-center py-12 text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Логов пока нет
              </div>
            )}

            {logs && logs.length > 0 && (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex gap-3 p-3 rounded-lg text-sm ${
                      log.direction === "in"
                        ? "bg-blue-50 border border-blue-100"
                        : "bg-gray-50 border border-gray-100"
                    }`}
                  >
                    <div className="shrink-0">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        log.direction === "in"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-200 text-gray-600"
                      }`}>
                        {log.direction === "in" ? "IN" : "OUT"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {log.telegram_username && (
                        <span className="text-xs text-gray-400 mr-2">@{log.telegram_username}</span>
                      )}
                      <span className="break-words whitespace-pre-wrap">{log.text}</span>
                    </div>
                    <div className="shrink-0 text-xs text-gray-400">
                      {new Date(log.created_at).toLocaleTimeString("ru-RU", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* === Generated config tab === */}
        <TabsContent value="config">
          <div className="p-6 rounded-xl border border-gray-200 bg-white space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Сгенерированный конфиг</h3>
                <p className="text-sm text-gray-500">
                  Файлы для деплоя бота. Скопируйте каждый файл в нужную директорию OpenClaw.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchConfig()}>
                <RefreshCw className="h-4 w-4 mr-1" /> Обновить
              </Button>
            </div>

            {/* openclaw.json */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500 font-mono">openclaw.json</span>
                </div>
                <button
                  onClick={() => generatedConfig && copyText(generatedConfig.openclawJson, "json")}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                >
                  {copied === "json" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied === "json" ? "Скопировано" : "Копировать"}
                </button>
              </div>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre">
                {generatedConfig?.openclawJson || "Загрузка..."}
              </pre>
            </div>

            {/* SOUL.md */}
            {generatedConfig?.soulMd && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500 font-mono">workspace/SOUL.md</span>
                  </div>
                  <button
                    onClick={() => copyText(generatedConfig.soulMd, "soul")}
                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                  >
                    {copied === "soul" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied === "soul" ? "Скопировано" : "Копировать"}
                  </button>
                </div>
                <pre className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap text-gray-700">
                  {generatedConfig.soulMd}
                </pre>
              </div>
            )}

            {/* AGENTS.md */}
            {generatedConfig?.agentsMd && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500 font-mono">workspace/AGENTS.md</span>
                  </div>
                  <button
                    onClick={() => copyText(generatedConfig.agentsMd, "agents")}
                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                  >
                    {copied === "agents" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied === "agents" ? "Скопировано" : "Копировать"}
                  </button>
                </div>
                <pre className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap text-gray-700">
                  {generatedConfig.agentsMd}
                </pre>
              </div>
            )}

            {/* Skill files */}
            {generatedConfig?.skillFiles && generatedConfig.skillFiles.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Файлы навыков</h4>
                {generatedConfig.skillFiles.map((sf, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileCode className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500 font-mono">skills/{sf.filename}</span>
                      </div>
                      <button
                        onClick={() => copyText(sf.code, `skill-file-${idx}`)}
                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                      >
                        {copied === `skill-file-${idx}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied === `skill-file-${idx}` ? "Скопировано" : "Копировать"}
                      </button>
                    </div>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre">
                      {sf.code}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
