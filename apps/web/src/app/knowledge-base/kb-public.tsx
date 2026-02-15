"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, ChevronRight, FileText, Search } from "lucide-react";
import { trpc } from "@/trpc/client";

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors">
        <span className="font-medium text-white">{title}</span>
        <ChevronDown className={`h-5 w-5 text-white/30 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-5 text-white/50 leading-relaxed whitespace-pre-line">{children}</div>}
    </div>
  );
}

export function KnowledgeBasePublic() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = trpc.knowledgebase.getPublished.useQuery();
  const sections = data ?? [];

  const filtered = search.trim()
    ? sections
        .map((s) => ({
          ...s,
          articles: s.articles.filter(
            (a) =>
              a.title.toLowerCase().includes(search.toLowerCase()) ||
              a.content.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((s) => s.articles.length > 0 || s.title.toLowerCase().includes(search.toLowerCase()))
    : sections;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white antialiased">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">C</div>
              <span className="text-white font-semibold text-lg hidden sm:block">Cargo Market</span>
            </Link>
            <ChevronRight className="h-4 w-4 text-white/20 hidden sm:block" />
            <span className="text-white/50 text-sm hidden sm:block">База знаний</span>
          </div>
          <Link href="/auth/customer">
            <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-all">Войти</button>
          </Link>
        </div>
      </nav>

      {/* Header */}
      <header className="pt-28 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-white/30 hover:text-white/50 transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> На главную
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold">
            <span className="text-white">База знаний: </span>
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">импорт из Китая</span>
          </h1>
          <p className="mt-4 text-lg text-white/40 max-w-3xl">
            Документы, таможня, сертификация, логистика и налоги — всё для успешного импорта.
          </p>

          {/* Search */}
          <div className="mt-8 relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
            <input
              type="text"
              placeholder="Поиск по базе знаний..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/40 transition-colors"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 pb-24">
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 mx-auto text-white/10 mb-4" />
            <p className="text-white/40 text-lg">
              {search ? "Ничего не найдено" : "База знаний пока пуста"}
            </p>
            {search && (
              <button onClick={() => setSearch("")} className="mt-3 text-sm text-cyan-400 hover:underline">
                Сбросить поиск
              </button>
            )}
          </div>
        )}

        <div className="space-y-10">
          {filtered.map((section) => (
            <section key={section.id} id={section.slug}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/20 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">{section.title}</h2>
                  {section.description && <p className="text-sm text-white/40">{section.description}</p>}
                </div>
              </div>

              <div className="space-y-3">
                {section.articles.map((article) => (
                  <Accordion key={article.id} title={article.title}>
                    {article.content}
                  </Accordion>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        {!isLoading && sections.length > 0 && (
          <div className="mt-16 p-8 md:p-12 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-cyan-500/[0.05] to-indigo-500/[0.05] text-center">
            <h3 className="text-2xl font-bold text-white">Готовы начать импорт?</h3>
            <p className="mt-3 text-white/40">Создайте заявку и получите предложения от проверенных карго-компаний</p>
            <Link href="/auth/customer">
              <button className="mt-6 px-8 py-3 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-xl text-white font-semibold hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all active:scale-[0.98]">
                Получить предложения <ArrowRight className="inline-block ml-2 h-5 w-5" />
              </button>
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="text-white font-semibold">Cargo Market</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-white/30">
            <Link href="/" className="hover:text-white/60 transition-colors">Главная</Link>
            <Link href="/auth/customer" className="hover:text-white/60 transition-colors">Для клиентов</Link>
            <Link href="/auth/carrier" className="hover:text-white/60 transition-colors">Для карго</Link>
          </div>
          <p className="text-sm text-white/20">&copy; 2026 Cargo Market</p>
        </div>
      </footer>
    </div>
  );
}
