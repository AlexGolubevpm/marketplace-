import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Clock, User, FileText, ExternalLink } from "lucide-react";
import {
  getArticleBySlug,
  getRedirect,
  getAllPublishedArticles,
} from "@/lib/knowledge-queries";
import { MdxRenderer, extractHeadings } from "@/components/knowledge/mdx-renderer";
import { KnowledgeToc } from "@/components/knowledge/toc";

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  try {
    const articles = await getAllPublishedArticles();
    return articles.map((a) => ({ slug: [a.slug] }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const slugStr = slug.join("/");
  const article = await getArticleBySlug(slugStr);

  if (!article) {
    return { title: "Статья не найдена | Cargo Marketplace" };
  }

  const canonical =
    article.canonical_override ??
    `https://cargomarketplace.ru/knowledge/${article.slug}`;

  return {
    title: `${article.title} — доставка из Китая | Cargo Marketplace`,
    description: article.description ?? undefined,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${article.title} — доставка из Китая | Cargo Marketplace`,
      description: article.description ?? undefined,
      type: "article",
      url: canonical,
      publishedTime: article.published_at?.toISOString(),
      modifiedTime: article.updated_at.toISOString(),
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const slugStr = slug.join("/");

  // Check redirect first
  const redirect = await getRedirect(`/knowledge/${slugStr}`);
  if (redirect) {
    permanentRedirect(redirect.to_path);
  }

  const article = await getArticleBySlug(slugStr);
  if (!article) notFound();

  const headings = extractHeadings(article.content);
  const canonical =
    article.canonical_override ??
    `https://cargomarketplace.ru/knowledge/${article.slug}`;

  const breadcrumbs = [
    { name: "Главная", url: "https://cargomarketplace.ru" },
    { name: "База знаний", url: "https://cargomarketplace.ru/knowledge" },
    ...(article.category
      ? [{ name: article.category.title, url: `https://cargomarketplace.ru/knowledge/category/${article.category.slug}` }]
      : []),
    { name: article.title, url: canonical },
  ];

  const jsonLd: Record<string, unknown>[] = [
    // Article
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.description,
      url: canonical,
      datePublished: article.published_at?.toISOString(),
      dateModified: article.updated_at.toISOString(),
      author: article.author_name
        ? { "@type": "Person", name: article.author_name }
        : { "@type": "Organization", name: "Cargo Marketplace" },
      publisher: {
        "@type": "Organization",
        name: "Cargo Marketplace",
        url: "https://cargomarketplace.ru",
      },
    },
    // Breadcrumbs
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.name,
        item: b.url,
      })),
    },
  ];

  // FAQPage JSON-LD
  if (article.faq_items && article.faq_items.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: article.faq_items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
  }

  return (
    <>
      {/* JSON-LD */}
      {jsonLd.map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}

      <div className="min-h-screen bg-white">
        {/* Breadcrumbs */}
        <nav
          aria-label="Хлебные крошки"
          className="bg-gray-50 border-b border-gray-100"
        >
          <div className="mx-auto max-w-6xl px-4 py-3">
            <ol className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
              {breadcrumbs.map((crumb, i) => (
                <li key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3 text-gray-300" />}
                  {i === breadcrumbs.length - 1 ? (
                    <span className="text-gray-700 font-medium line-clamp-1">
                      {crumb.name}
                    </span>
                  ) : (
                    <Link
                      href={crumb.url.replace("https://cargomarketplace.ru", "")}
                      className="hover:text-red-600 transition-colors"
                    >
                      {crumb.name}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex gap-10 items-start">
            {/* ── Main content ───────────────────────────────────────────── */}
            <article className="flex-1 min-w-0">
              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mb-4">
                {article.category && (
                  <Link
                    href={`/knowledge/category/${article.category.slug}`}
                    className="text-red-600 font-medium hover:text-red-700"
                  >
                    {article.category.title}
                  </Link>
                )}
                {article.published_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Обновлено{" "}
                    {new Date(article.updated_at).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                )}
                {article.author_name && (
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {article.author_name}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-6">
                {article.title}
              </h1>

              {/* Short answer / description */}
              {article.description && (
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-5 mb-8">
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-1">
                    Краткий ответ
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    {article.description}
                  </p>
                </div>
              )}

              {/* Content */}
              <div className="knowledge-content">
                <MdxRenderer content={article.content} />
              </div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/knowledge/tag/${tag.slug}`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      # {tag.title}
                    </Link>
                  ))}
                </div>
              )}

              {/* FAQ */}
              {article.faq_items && article.faq_items.length > 0 && (
                <section className="mt-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-5">
                    Частые вопросы
                  </h2>
                  <div className="space-y-3">
                    {article.faq_items.map((item, i) => (
                      <details
                        key={i}
                        className="group rounded-xl border border-gray-100 bg-gray-50 overflow-hidden"
                      >
                        <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium text-gray-900 list-none select-none hover:bg-gray-100 transition-colors">
                          <span>{item.question}</span>
                          <span className="text-gray-400 group-open:rotate-45 transition-transform text-xl ml-4 shrink-0">
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

              {/* Sources */}
              {article.sources && article.sources.length > 0 && (
                <section className="mt-10 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Источники
                  </h3>
                  <ul className="space-y-2">
                    {article.sources.map((src, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <ExternalLink className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="text-gray-600 hover:text-red-600 transition-colors"
                        >
                          {src.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Feedback */}
              <div className="mt-12 rounded-xl border border-gray-100 bg-gray-50 p-5 text-center">
                <p className="text-gray-600 text-sm mb-3">
                  Эта статья была полезна?
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button className="px-5 py-2 rounded-lg bg-green-100 text-green-700 text-sm font-medium hover:bg-green-200 transition-colors">
                    👍 Да
                  </button>
                  <button className="px-5 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors">
                    👎 Нет
                  </button>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 p-6 text-white flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1">
                  <p className="font-bold text-lg">Готовы к отправке?</p>
                  <p className="text-red-100 text-sm mt-1">
                    Рассчитаем стоимость доставки и подберём лучший маршрут
                  </p>
                </div>
                <Link
                  href="/get-quote"
                  className="shrink-0 bg-white text-red-600 font-bold px-6 py-3 rounded-xl hover:bg-red-50 transition-colors text-sm"
                >
                  Получить расчёт
                </Link>
              </div>

              {/* Related articles */}
              {article.related && article.related.length > 0 && (
                <section className="mt-12">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Похожие статьи
                  </h2>
                  <div className="grid gap-3">
                    {article.related.map((rel) => (
                      <Link
                        key={rel.id}
                        href={`/knowledge/${rel.slug}`}
                        className="group flex items-start gap-3 rounded-xl border border-gray-100 p-4 hover:border-red-200 hover:bg-red-50 transition-all"
                      >
                        <FileText className="h-4 w-4 text-gray-400 mt-0.5 shrink-0 group-hover:text-red-500" />
                        <div>
                          <p className="font-medium text-gray-800 group-hover:text-red-700 transition-colors">
                            {rel.title}
                          </p>
                          {rel.description && (
                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                              {rel.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </article>

            {/* ── Sticky TOC ─────────────────────────────────────────────── */}
            {headings.length > 0 && (
              <aside className="hidden lg:block w-60 shrink-0">
                <div className="sticky top-6">
                  <KnowledgeToc headings={headings} />
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
