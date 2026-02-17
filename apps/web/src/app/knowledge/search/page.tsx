import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Search, BookOpen } from "lucide-react";
import { db } from "@/lib/db";
import { knowledgeArticles, knowledgeCategories } from "@cargo/db";
import { eq, and, sql } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Поиск — База знаний | Cargo Marketplace",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  let results: Array<{
    id: string;
    title: string;
    slug: string;
    description: string | null;
    category_id: string | null;
  }> = [];

  if (query.length >= 2) {
    const likeQ = `%${query}%`;
    results = await db
      .select({
        id: knowledgeArticles.id,
        title: knowledgeArticles.title,
        slug: knowledgeArticles.slug,
        description: knowledgeArticles.description,
        category_id: knowledgeArticles.category_id,
      })
      .from(knowledgeArticles)
      .where(
        and(
          eq(knowledgeArticles.status, "published"),
          sql`(
            ${knowledgeArticles.title} ILIKE ${likeQ}
            OR ${knowledgeArticles.description} ILIKE ${likeQ}
            OR ${knowledgeArticles.content} ILIKE ${likeQ}
          )`
        )
      )
      .limit(20);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <nav className="bg-gray-50 border-b border-gray-100">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <ol className="flex items-center gap-1 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-red-600">Главная</Link></li>
            <li><ChevronRight className="h-3 w-3 text-gray-300" /></li>
            <li><Link href="/knowledge" className="hover:text-red-600">База знаний</Link></li>
            <li><ChevronRight className="h-3 w-3 text-gray-300" /></li>
            <li className="text-gray-700 font-medium">Поиск</li>
          </ol>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Поиск по базе знаний</h1>

        {/* Search form */}
        <form method="get" action="/knowledge/search" className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Введите запрос…"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              autoFocus
            />
          </div>
        </form>

        {query && (
          <p className="text-sm text-gray-500 mb-5">
            {results.length > 0
              ? `Найдено ${results.length} статей по запросу «${query}»`
              : `По запросу «${query}» ничего не найдено`}
          </p>
        )}

        {results.length > 0 ? (
          <div className="space-y-4">
            {results.map((article) => (
              <Link
                key={article.id}
                href={`/knowledge/${article.slug}`}
                className="group flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-5 hover:border-red-200 hover:shadow-sm transition-all"
              >
                <BookOpen className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <h2 className="font-bold text-gray-900 group-hover:text-red-700 transition-colors">
                    {article.title}
                  </h2>
                  {article.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{article.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : query.length >= 2 ? (
          <div className="text-center py-16 text-gray-400">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Ничего не найдено</p>
            <p className="text-sm mt-1">Попробуйте другой запрос</p>
            <Link href="/knowledge" className="inline-block mt-4 text-red-600 hover:text-red-700 text-sm font-medium">
              ← Вернуться в базу знаний
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
