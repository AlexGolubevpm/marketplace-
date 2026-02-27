import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getAllFaqArticles } from "@/lib/knowledge-queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQ — частые вопросы об импорте из Китая | Cargo Marketplace",
  description:
    "Ответы на самые популярные вопросы об импорте из Китая: таможня, документы, стоимость, сроки доставки, НДС и сертификация.",
  alternates: { canonical: "https://cargomarketplace.ru/knowledge/faq" },
  robots: { index: true, follow: true },
};

export default async function FaqPage() {
  const articles = await getAllFaqArticles();

  const allFaq = articles.flatMap((a) =>
    (a.faq_items ?? []).map((faq) => ({
      ...faq,
      articleTitle: a.title,
      articleSlug: a.slug,
    }))
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFaq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: "https://cargomarketplace.ru" },
      { "@type": "ListItem", position: 2, name: "База знаний", item: "https://cargomarketplace.ru/knowledge" },
      { "@type": "ListItem", position: 3, name: "FAQ", item: "https://cargomarketplace.ru/knowledge/faq" },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="min-h-screen bg-white">
        {/* Breadcrumbs */}
        <nav className="bg-gray-50 border-b border-gray-100">
          <div className="mx-auto max-w-4xl px-4 py-3">
            <ol className="flex items-center gap-1 text-sm text-gray-500">
              <li><Link href="/" className="hover:text-red-600">Главная</Link></li>
              <li><ChevronRight className="h-3 w-3 text-gray-300" /></li>
              <li><Link href="/knowledge" className="hover:text-red-600">База знаний</Link></li>
              <li><ChevronRight className="h-3 w-3 text-gray-300" /></li>
              <li className="text-gray-700 font-medium">FAQ</li>
            </ol>
          </div>
        </nav>

        {/* Header */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-14 px-4 text-center">
          <div className="mx-auto max-w-2xl">
            <h1 className="text-3xl font-extrabold text-white mb-3">
              Частые вопросы об импорте из Китая
            </h1>
            <p className="text-gray-300">
              {allFaq.length} вопросов и ответов от специалистов
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-12">
          {allFaq.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>FAQ пока не добавлен</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allFaq.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-gray-100 bg-gray-50 overflow-hidden"
                >
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none hover:bg-gray-100 transition-colors">
                    <span className="font-medium text-gray-900 pr-4">{item.question}</span>
                    <span className="text-gray-400 group-open:rotate-45 transition-transform text-xl shrink-0">
                      +
                    </span>
                  </summary>
                  <div className="px-5 py-4 border-t border-gray-100 bg-white">
                    <p className="text-gray-600 text-sm leading-relaxed">{item.answer}</p>
                    <Link
                      href={`/knowledge/${item.articleSlug}`}
                      className="inline-flex items-center gap-1 mt-3 text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Подробнее в статье «{item.articleTitle}»
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </details>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 p-6 text-white text-center">
            <p className="font-bold text-lg mb-2">Не нашли ответ?</p>
            <p className="text-red-100 text-sm mb-4">
              Свяжитесь с нашими специалистами — они ответят на любой вопрос
            </p>
            <Link
              href="/get-quote"
              className="inline-block bg-white text-red-600 font-bold px-6 py-3 rounded-xl hover:bg-red-50 transition-colors text-sm"
            >
              Задать вопрос
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
