import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://cargomarketplace.ru";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/knowledge/", "/knowledge/category/", "/knowledge/tag/", "/knowledge/faq"],
        disallow: ["/knowledge/search", "/(admin)/", "/api/", "/c/", "/s/", "/auth/"],
      },
    ],
    sitemap: `${base}/knowledge/sitemap.xml`,
  };
}
