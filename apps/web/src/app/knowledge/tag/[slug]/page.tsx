import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, BookOpen, Clock, Tag } from "lucide-react";
import { getTagBySlug, getRedirect } from "@/lib/knowledge-queries";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTagBySlug(slug);
  if (!data) return { title: "Тег не найден | Cargo Marketplace" };

  const title = data.tag.meta_title ?? `${data.tag.title} — база знаний | Cargo Marketplace`;
  const description =
    data.tag.meta_description ?? data.tag.description ?? undefined;
  const canonical = `https://cargomarketplace.ru/knowledge/tag/${data.tag.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: { title, description, type: "website", url: canonical },
  };
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;

  const redirect = await getRedirect(`/knowledge/tag/${slug}`);
  if (redirect) permanentRedirect(redirect.to_path);

  const data = await getTagBySlug(slug);
  if (!data) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${data.tag.title} — база знаний`,
            url: `https://cargomarketplace.ru/knowledge/tag/${data.tag.slug}`,
          }),
        }}
      />

      <div className="min-h-screen bg-white">
        {/* Breadcrumbs */}
        <nav className="bg-gray-50 border-b border-gray-100">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <ol className="flex items-center gap-1 text-sm text-gray-500">
              <li><Link href="/" className="hover:text-red-600">Главная</Link></li>
              <li><ChevronRight className="h-3 w-3 text-gray-300" /></li>
              <li><Link href="/knowledge" className="hover:text-red-600">База знаний</Link></li>
              <li><ChevronRight className="h-3 w-3 text-gray-300" /></li>
              <li className="text-gray-700 font-medium">#{data.tag.title}</li>
            </ol>
          </div>
        </nav>

        {/* Header */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-12 px-4 text-center">
          <div className="mx-auto max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-gray-300 text-sm mb-4">
              <Tag className="h-4 w-4" />
              Тег
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-2">
              #{data.tag.title}
            </h1>
            {data.tag.description && (
              <p className="text-gray-300">{data.tag.description}</p>
            )}
            <p className="text-gray-400 text-sm mt-3">{data.articles.length} статей</p>
          </div>
        </div>

        {/* Articles */}
        <div className="mx-auto max-w-4xl px-4 py-12">
          {data.articles.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Статей с этим тегом пока нет</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/knowledge/${article.slug}`}
                  className="group flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 hover:border-red-200 hover:shadow-sm transition-all"
                >
                  <BookOpen className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-gray-900 group-hover:text-red-700 transition-colors leading-tight">
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
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-red-400 shrink-0 mt-0.5" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
