"use client";

import { useState } from "react";
import { Send, CheckCircle, HelpCircle, User, Mail } from "lucide-react";
import { trpc } from "@/trpc/client";

const TOPICS = [
  "Таможенное оформление",
  "Логистика и маршруты",
  "ТН ВЭД и коды",
  "Сертификация и ЕАС",
  "НДС и пошлины",
  "Маркировка (Честный знак)",
  "Другое",
];

export function KnowledgeQuestionForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    question: "",
    topic: "",
  });

  const submitMutation = trpc.knowledge.submitQuestion.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => setError(err.message || "Ошибка отправки. Попробуйте ещё раз."),
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Введите ваше имя"); return; }
    if (!form.question.trim()) { setError("Введите ваш вопрос"); return; }
    if (form.question.trim().length < 5) { setError("Вопрос слишком короткий"); return; }
    setError("");
    submitMutation.mutate({
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      question: form.question.trim(),
      topic: form.topic || undefined,
    });
  };

  if (submitted) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-8 text-center">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Вопрос отправлен!</h3>
        <p className="text-gray-600 mb-4">
          Мы рассмотрим ваш вопрос и, возможно, подготовим статью на эту тему.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setForm({ name: "", email: "", question: "", topic: "" });
          }}
          className="text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Задать ещё вопрос
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 p-6 md:p-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 mb-3">
          <HelpCircle className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">Задайте вопрос</span>
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
          Не нашли ответ?
        </h3>
        <p className="text-gray-500 text-sm max-w-lg mx-auto">
          Задайте вопрос — мы ответим и добавим информацию в базу знаний
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Ваше имя *"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all text-sm"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              placeholder="Email (необязательно)"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all text-sm"
            />
          </div>
        </div>

        <div>
          <select
            value={form.topic}
            onChange={(e) => update("topic", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all text-sm appearance-none"
          >
            <option value="">Выберите тему (необязательно)</option>
            {TOPICS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <textarea
            placeholder="Ваш вопрос *"
            rows={4}
            value={form.question}
            onChange={(e) => update("question", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all text-sm resize-none"
          />
        </div>

        {error && (
          <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitMutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold hover:from-red-700 hover:to-red-600 transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-red-500/10"
        >
          {submitMutation.isPending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Отправляем...
            </span>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Отправить вопрос
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400">
          Нажимая кнопку, вы соглашаетесь с обработкой персональных данных.
        </p>
      </form>
    </div>
  );
}
