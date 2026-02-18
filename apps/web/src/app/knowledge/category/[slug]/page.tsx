import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, BookOpen, Clock } from "lucide-react";
import { getCategoryBySlug, getRedirect } from "@/lib/knowledge-queries";

function pluralArticles(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} статья`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} статьи`;
  return `${n} статей`;
}

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryBySlug(slug);
  if (!data) return { title: "Категория не найдена | Cargo Marketplace" };

  const title = data.meta_title ?? `${data.title} — доставка из Китая | Cargo Marketplace`;
  const description = data.meta_description ?? data.description ?? undefined;
  const canonical =
    data.canonical_override ??
    `https://cargomarketplace.ru/knowledge/category/${data.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: { title, description, type: "website", url: canonical },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  const redirect = await getRedirect(`/knowledge/category/${slug}`);
  if (redirect) permanentRedirect(redirect.to_path);

  const data = await getCategoryBySlug(slug);
  if (!data) notFound();

  const canonical =
    data.canonical_override ??
    `https://cargomarketplace.ru/knowledge/category/${data.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: data.title,
    description: data.description,
    url: canonical,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Главная", item: "https://cargomarketplace.ru" },
        { "@type": "ListItem", position: 2, name: "База знаний", item: "https://cargomarketplace.ru/knowledge" },
        { "@type": "ListItem", position: 3, name: data.title, item: canonical },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-white">
        {/* Breadcrumbs */}
        <nav className="bg-gray-50 border-b border-gray-100">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <ol className="flex items-center gap-1 text-sm text-gray-500">
              <li>
                <Link href="/" className="hover:text-red-600 transition-colors">Главная</Link>
              </li>
              <li><ChevronRight className="h-3 w-3 text-gray-300" /></li>
              <li>
                <Link href="/knowledge" className="hover:text-red-600 transition-colors">
                  База знаний
                </Link>
              </li>
              <li><ChevronRight className="h-3 w-3 text-gray-300" /></li>
              <li className="text-gray-700 font-medium">{data.title}</li>
            </ol>
          </div>
        </nav>

        {/* Hero */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-14 px-4">
          <div className="mx-auto max-w-3xl text-center">
            {data.image_url ? (
              <img
                src={data.image_url}
                alt={data.title}
                className="mx-auto mb-4 h-16 w-16 rounded-2xl object-cover"
                width={64}
                height={64}
              />
            ) : (
              <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl">
                {data.icon ?? "📂"}
              </div>
            )}
            <h1 className="text-3xl font-extrabold text-white mb-3">{data.title}</h1>
            {data.description && (
              <p className="text-gray-300 text-lg leading-relaxed">{data.description}</p>
            )}
            <p className="mt-4 text-gray-400 text-sm">{pluralArticles(data.articles.length)}</p>
          </div>
        </div>

        {/* Articles */}
        <div className="mx-auto max-w-4xl px-4 py-12">
          {data.articles.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>В этой категории пока нет статей</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/knowledge/${article.slug}`}
                  className="group flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 hover:border-red-200 hover:shadow-sm transition-all"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-gray-900 text-lg group-hover:text-red-700 transition-colors leading-tight">
                      {article.title}
                    </h2>
                    {article.description && (
                      <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                        {article.description}
                      </p>
                    )}
                    {article.published_at && (
                      <span className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                        <Clock className="h-3 w-3" />
                        {new Date(article.published_at).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-red-400 transition-colors shrink-0 mt-0.5" />
                </Link>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 p-6 text-white flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <p className="font-bold text-lg">Нужна консультация?</p>
              <p className="text-red-100 text-sm mt-1">
                Специалисты помогут разобраться в деталях и оформить заявку
              </p>
            </div>
            <Link
              href="/get-quote"
              className="shrink-0 bg-white text-red-600 font-bold px-6 py-3 rounded-xl hover:bg-red-50 transition-colors text-sm"
            >
              Получить расчёт
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
