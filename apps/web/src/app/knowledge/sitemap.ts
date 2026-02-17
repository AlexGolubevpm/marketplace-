import type { MetadataRoute } from "next";
import { getAllPublishedArticles, getPublishedCategories } from "@/lib/knowledge-queries";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://cargomarketplace.ru";

  const [articles, categories] = await Promise.all([
    getAllPublishedArticles(),
    getPublishedCategories(),
  ]);

  const articleUrls: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${base}/knowledge/${a.slug}`,
    lastModified: a.updated_at,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryUrls: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/knowledge/category/${c.slug}`,
    lastModified: c.updated_at,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    {
      url: `${base}/knowledge`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/knowledge/faq`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...categoryUrls,
    ...articleUrls,
  ];
}
