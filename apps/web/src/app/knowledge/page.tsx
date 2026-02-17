import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Search, ArrowRight, Tag } from "lucide-react";
import {
  getPublishedCategories,
  getFeaturedArticles,
  getAllFaqArticles,
  getRecentArticles,
} from "@/lib/knowledge-queries";

export const revalidate = 3600; // ISR: revalidate every hour

export const metadata: Metadata = {
  title: "База знаний — доставка из Китая | Cargo Marketplace",
  description:
    "Полное руководство по импорту товаров из Китая в Россию: документы, таможня, ТН ВЭД, НДС, логистика, сертификация ЕАС и маркировка.",
  alternates: {
    canonical: "https://cargomarketplace.ru/knowledge",
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "База знаний — доставка из Китая | Cargo Marketplace",
    description:
      "Полное руководство по импорту товаров из Китая в Россию: документы, таможня, ТН ВЭД, НДС, логистика, сертификация ЕАС.",
    type: "website",
    url: "https://cargomarketplace.ru/knowledge",
  },
};

export default async function KnowledgePage() {
  const [categories, featured, recent, faqArticles] = await Promise.all([
    getPublishedCategories(),
    getFeaturedArticles(6),
    getRecentArticles(8),
    getAllFaqArticles(),
  ]);

  const topFaq = faqArticles
    .flatMap((a) =>
      (a.faq_items ?? []).slice(0, 2).map((faq) => ({ ...faq, articleSlug: a.slug }))
    )
    .slice(0, 5);

  const startingGuide = categories.slice(0, 3);

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "База знаний — Cargo Marketplace",
            description:
              "Справочник по импорту из Китая: документы, таможня, логистика.",
            url: "https://cargomarketplace.ru/knowledge",
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Главная", item: "https://cargomarketplace.ru" },
                { "@type": "ListItem", position: 2, name: "База знаний", item: "https://cargomarketplace.ru/knowledge" },
              ],
            },
          }),
        }}
      />

      <div className="min-h-screen bg-white">
        {/* ── Hero / Search ─────────────────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-20 px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-sm font-medium text-red-400 uppercase tracking-widest">
              База знаний
            </p>
            <h1 className="text-4xl font-extrabold text-white mb-4 leading-tight">
              Всё об импорте из Китая
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Пошаговые руководства, чеклисты и FAQ по таможне, документам и
              логистике
            </p>

            {/* Search form — action goes to /knowledge/search (noindex page) */}
            <form action="/knowledge/search" method="get" role="search">
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="search"
                  name="q"
                  placeholder="Поиск по базе знаний…"
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-base"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  Найти
                </button>
              </div>
            </form>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-12">
          {/* ── С чего начать ─────────────────────────────────────────────── */}
          {startingGuide.length > 0 && (
            <section className="mb-14">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">С чего начать</h2>
              <p className="text-gray-500 mb-6 text-sm">
                Ключевые разделы для новых клиентов
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {startingGuide.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/knowledge/category/${cat.slug}`}
                    className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-5 hover:border-red-200 hover:bg-red-50 transition-all"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-2xl">
                      {cat.icon ?? "📖"}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-red-700 transition-colors">
                        {cat.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {cat.article_count} статей
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Категории ────────────────────────────────────────────────── */}
          {categories.length > 0 && (
            <section className="mb-14">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Все категории
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/knowledge/category/${cat.slug}`}
                    className="group flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden hover:shadow-md hover:border-red-200 transition-all"
                  >
                    {cat.image_url ? (
                      <div className="h-40 bg-gray-100 overflow-hidden">
                        <img
                          src={cat.image_url}
                          alt={cat.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          width={400}
                          height={160}
                        />
                      </div>
                    ) : (
                      <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-5xl">
                        {cat.icon ?? "📂"}
                      </div>
                    )}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-red-700 transition-colors">
                        {cat.title}
                      </h3>
                      {cat.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 flex-1">
                          {cat.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {cat.article_count} статей
                        </span>
                        <span className="text-xs font-medium text-red-600 group-hover:underline">
                          Читать →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Популярные статьи ─────────────────────────────────────────── */}
          {featured.length > 0 && (
            <section className="mb-14">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Популярные статьи
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featured.map((article) => (
                  <Link
                    key={article.id}
                    href={`/knowledge/${article.slug}`}
                    className="group flex gap-4 rounded-xl border border-gray-100 bg-white p-5 hover:border-red-200 hover:shadow-sm transition-all"
                  >
                    <BookOpen className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-red-700 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      {article.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {article.description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Новые статьи ─────────────────────────────────────────────── */}
          {recent.length > 0 && (
            <section className="mb-14">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Недавно добавлено
              </h2>
              <div className="space-y-3">
                {recent.map((article) => (
                  <Link
                    key={article.id}
                    href={`/knowledge/${article.slug}`}
                    className="group flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-none"
                  >
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-red-500 transition-colors shrink-0" />
                    <span className="font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                      {article.title}
                    </span>
                    {article.published_at && (
                      <span className="ml-auto text-xs text-gray-400 shrink-0">
                        {new Date(article.published_at).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── FAQ ──────────────────────────────────────────────────────── */}
          {topFaq.length > 0 && (
            <section className="mb-14">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Частые вопросы
                </h2>
                <Link
                  href="/knowledge/faq"
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Все вопросы →
                </Link>
              </div>
              <div className="space-y-3">
                {topFaq.map((item, i) => (
                  <details
                    key={i}
                    className="group rounded-xl border border-gray-100 bg-gray-50 overflow-hidden"
                  >
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium text-gray-900 list-none select-none hover:bg-gray-100 transition-colors">
                      <span>{item.question}</span>
                      <span className="text-gray-400 group-open:rotate-45 transition-transform text-xl ml-4">
                        +
                      </span>
                    </summary>
                    <div className="px-5 py-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 bg-white">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* ── CTA ──────────────────────────────────────────────────────── */}
          <section className="rounded-2xl bg-gradient-to-r from-red-600 to-red-700 p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-2">
              Готовы отправить груз из Китая?
            </h2>
            <p className="text-red-100 mb-6">
              Наши специалисты рассчитают стоимость и подберут оптимальный
              маршрут
            </p>
            <Link
              href="/get-quote"
              className="inline-block bg-white text-red-600 font-bold px-8 py-3 rounded-xl hover:bg-red-50 transition-colors"
            >
              Получить расчёт бесплатно
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
