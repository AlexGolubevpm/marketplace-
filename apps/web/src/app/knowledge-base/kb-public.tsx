"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, ChevronRight, Search, User, LogIn, Truck } from "lucide-react";
import { trpc } from "@/trpc/client";
import { BrandedLogo, useBranding } from "@/components/cngo-logo";
import { SESSION_KEYS } from "@/lib/auth";

/* ── Auth helpers ── */
type SessionInfo = { name: string; role: string; href: string } | null;

function useSession(): SessionInfo {
  const [session, setSession] = useState<SessionInfo>(null);
  useEffect(() => {
    try {
      for (const key of [SESSION_KEYS.CUSTOMER, SESSION_KEYS.CARRIER]) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const s = JSON.parse(raw);
          if (s.logged_in) {
            setSession({
              name: s.name || s.username || "User",
              role: s.role,
              href: s.role === "carrier" ? "/s/requests" : "/c/requests",
            });
            return;
          }
        }
      }
    } catch (err) { console.error("Failed to read user session:", err); }
    try {
      const raw = localStorage.getItem(SESSION_KEYS.ADMIN);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.logged_in) {
          setSession({ name: s.login || "Admin", role: "admin", href: "/dashboard" });
          return;
        }
      }
    } catch (err) { console.error("Failed to read admin session:", err); }
  }, []);
  return session;
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors">
        <span className="font-medium text-gray-900">{title}</span>
        <ChevronDown className={`h-5 w-5 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-5 text-gray-500 leading-relaxed whitespace-pre-line">{children}</div>}
    </div>
  );
}

export function KnowledgeBasePublic() {
  const session = useSession();
  const branding = useBranding();
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
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <BrandedLogo className="h-[72px] w-auto" />
              <span className="text-gray-900 font-bold text-lg hidden sm:block">{branding.logo_text}</span>
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-300 hidden sm:block" />
            <span className="text-gray-500 text-sm hidden sm:block">База знаний</span>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <>
                <span className="hidden sm:block text-sm text-gray-500">{session.name}</span>
                <Link href={session.href}>
                  <button className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors">
                    <User className="inline-block mr-1.5 h-4 w-4" />Кабинет
                  </button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/carrier" className="hidden sm:block">
                  <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all">
                    <Truck className="inline-block mr-1.5 h-4 w-4" />Для карго
                  </button>
                </Link>
                <Link href="/auth/customer">
                  <button className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors">
                    <LogIn className="inline-block mr-1.5 h-4 w-4" />Войти
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="pt-24 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> На главную
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold">
            <span className="text-gray-900">База знаний: </span>
            <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">импорт из Китая</span>
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-3xl">
            Документы, таможня, сертификация, логистика и налоги — всё для успешного импорта.
          </p>

          {/* Search */}
          <div className="mt-8 relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по базе знаний..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 pb-24">
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 text-lg">
              {search ? "Ничего не найдено" : "База знаний пока пуста"}
            </p>
            {search && (
              <button onClick={() => setSearch("")} className="mt-3 text-sm text-red-500 hover:underline">
                Сбросить поиск
              </button>
            )}
          </div>
        )}

        <div className="space-y-10">
          {filtered.map((section) => (
            <section key={section.id} id={section.slug}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">{section.title}</h2>
                  {section.description && <p className="text-sm text-gray-500">{section.description}</p>}
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
          <div className="mt-16 p-8 md:p-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-center shadow-xl shadow-red-600/10">
            <h3 className="text-2xl font-bold text-white">Готовы начать импорт?</h3>
            <p className="mt-3 text-red-100">Создайте заявку и получите предложения от проверенных карго-компаний</p>
            <Link href="/auth/customer">
              <button className="mt-6 px-8 py-3 bg-white rounded-xl text-red-600 font-semibold hover:bg-gray-50 transition-all active:scale-[0.98] shadow-lg">
                Получить предложения <ArrowRight className="inline-block ml-2 h-5 w-5" />
              </button>
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2">
            <BrandedLogo className="h-[72px] w-auto" />
            <span className="text-gray-900 font-semibold">{branding.logo_text}</span>
          </Link>
          <div className="flex items-center gap-8 text-sm text-gray-400">
            <Link href="/" className="hover:text-gray-900 transition-colors">Главная</Link>
            <Link href="/auth/customer" className="hover:text-gray-900 transition-colors">Вход для клиентов</Link>
            <Link href="/auth/carrier" className="hover:text-gray-900 transition-colors">Вход для карго</Link>
          </div>
          <p className="text-sm text-gray-300">&copy; 2026 {branding.logo_text}</p>
        </div>
      </footer>
    </div>
  );
}
