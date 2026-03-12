import { NextRequest, NextResponse } from "next/server";

// --- WB Helpers ---

function getWbBasketNumber(vol: number): number {
  // Verified ranges for older products (baskets 01-21)
  if (vol <= 143) return 1;
  if (vol <= 287) return 2;
  if (vol <= 431) return 3;
  if (vol <= 719) return 4;
  if (vol <= 1007) return 5;
  if (vol <= 1061) return 6;
  if (vol <= 1115) return 7;
  if (vol <= 1169) return 8;
  if (vol <= 1313) return 9;
  if (vol <= 1601) return 10;
  if (vol <= 1655) return 11;
  if (vol <= 1919) return 12;
  if (vol <= 2045) return 13;
  if (vol <= 2189) return 14;
  if (vol <= 2405) return 15;
  if (vol <= 2621) return 16;
  if (vol <= 2837) return 17;
  if (vol <= 3053) return 18;
  if (vol <= 3269) return 19;
  if (vol <= 3485) return 20;
  if (vol <= 3701) return 21;
  // For newer products, estimate (will be refined by probing)
  return 21 + Math.ceil((vol - 3701) / 260);
}

function basketHost(n: number): string {
  return `basket-${String(n).padStart(2, "0")}.wbbasket.ru`;
}

function wbCdnPath(vol: number, part: number, nmId: number): string {
  return `/vol${vol}/part${part}/${nmId}`;
}

interface ProductData {
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  discount: number;
  category: string;
  subcategory: string;
  weight: number | null;
  dimensions: { length: number; width: number; height: number } | null;
  images: string[];
  source: "wb" | "ozon";
  sourceUrl: string;
  productId: string;
  rating: number | null;
  reviewCount: number | null;
  quantity: number | null;
}

function fetchWithTimeout(
  url: string,
  opts: RequestInit = {},
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

// --- Find the correct WB basket and fetch card.json ---
// WB basket ranges change over time. For older products (vol <= 3701)
// we use verified hardcoded ranges. For newer products, we estimate
// the basket number and probe nearby baskets in parallel.

async function fetchWbCardJson(
  nmId: number
): Promise<{ card: any; host: string }> {
  const vol = Math.floor(nmId / 100000);
  const part = Math.floor(nmId / 1000);
  const path = wbCdnPath(vol, part, nmId);

  async function tryBasket(basketNum: number): Promise<{ card: any; host: string }> {
    const host = basketHost(basketNum);
    const url = `https://${host}${path}/info/ru/card.json`;
    const res = await fetchWithTimeout(url, { headers: { Accept: "application/json" } }, 8000);
    if (!res.ok) throw new Error(`basket-${basketNum}: ${res.status}`);
    const card = await res.json();
    if (!card.imt_name) throw new Error("empty card");
    return { card, host };
  }

  const estimate = getWbBasketNumber(vol);

  // For older products with verified ranges, try directly
  if (vol <= 3701) {
    try {
      return await tryBasket(estimate);
    } catch {
      // If hardcoded range fails, fall through to probing
    }
  }

  // Probe multiple baskets in parallel — first 200 wins
  const candidates = new Set<number>();
  for (let offset = 0; offset <= 5; offset++) {
    candidates.add(estimate + offset);
    if (estimate - offset >= 22) candidates.add(estimate - offset);
  }
  // Also try ±6..8 for extra safety
  for (let offset = 6; offset <= 8; offset++) {
    candidates.add(estimate + offset);
    if (estimate - offset >= 22) candidates.add(estimate - offset);
  }

  const promises = [...candidates].map((n) => tryBasket(n));

  try {
    return await Promise.any(promises);
  } catch {
    throw new Error(
      "Товар не найден на WB. Проверьте ссылку — возможно товар удалён."
    );
  }
}

// ==========================================================
// WB PARSER
// Uses: basket CDN card.json (product info)
//       search.wb.ru (price, rating)
//       product-order-qnt.wildberries.ru (stock quantity)
// ==========================================================

async function parseWildberries(url: string): Promise<ProductData> {
  const match = url.match(/wildberries\.ru\/catalog\/(\d+)/);
  if (!match) throw new Error("Не удалось извлечь ID товара из ссылки WB");

  const productId = match[1];
  const nmId = parseInt(productId, 10);

  // ---- 1. Basket CDN card.json — product info ----
  const { card, host } = await fetchWbCardJson(nmId);

  const name = card.imt_name || "";
  const brand = card.selling?.brand_name || "";
  const category = card.subj_root_name || "";
  const subcategory = card.subj_name || "";
  const photoCount = card.media?.photo_count || 1;

  if (!name) {
    throw new Error("Не удалось получить название товара с WB.");
  }

  // Generate image URLs using the found basket host, with verification
  const vol = Math.floor(nmId / 100000);
  const part = Math.floor(nmId / 1000);
  const path = wbCdnPath(vol, part, nmId);
  let images: string[] = [];

  // Try to find a working image host — wbbasket.ru may not match wbcontent.net
  const candidateHosts = [host];
  // Also try wbcontent.net variant
  const basketNum = host.match(/basket-(\d+)/)?.[1];
  if (basketNum) {
    candidateHosts.push(`basket-${basketNum}.wbcontent.net`);
  }

  let workingHost = "";
  for (const h of candidateHosts) {
    const testUrl = `https://${h}${path}/images/big/1.jpg`;
    try {
      const res = await fetchWithTimeout(testUrl, { method: "HEAD" }, 5000);
      if (res.ok) {
        workingHost = h;
        break;
      }
    } catch {
      // try next
    }
  }

  // If primary host didn't work, probe nearby basket numbers on both domains
  if (!workingHost) {
    const baseNum = parseInt(basketNum || "21", 10);
    const probePromises: Promise<string>[] = [];
    for (let offset = -3; offset <= 3; offset++) {
      const n = baseNum + offset;
      if (n < 1) continue;
      const padded = String(n).padStart(2, "0");
      for (const domain of ["wbbasket.ru", "wbcontent.net"]) {
        const h = `basket-${padded}.${domain}`;
        probePromises.push(
          fetchWithTimeout(`https://${h}${path}/images/big/1.jpg`, { method: "HEAD" }, 5000)
            .then((r) => (r.ok ? h : Promise.reject()))
            .catch(() => Promise.reject())
        );
      }
    }
    try {
      workingHost = await Promise.any(probePromises);
    } catch {
      // Fall back to original host — images may still be accessible externally
      workingHost = host;
    }
  }

  for (let i = 1; i <= Math.min(photoCount, 5); i++) {
    images.push(`https://${workingHost}${path}/images/big/${i}.jpg`);
  }

  // Extract weight and dimensions from options
  let weight: number | null = null;
  let dimensions: { length: number; width: number; height: number } | null =
    null;

  if (card.options && Array.isArray(card.options)) {
    let dimL: number | null = null;
    let dimW: number | null = null;
    let dimH: number | null = null;

    for (const opt of card.options) {
      const optName = (opt.name || "").toLowerCase();
      const value = opt.value || "";

      if ((optName.includes("вес") || optName === "weight") && !weight) {
        const wm = value.match(/([\d.,]+)\s*(кг|г|гр|kg|g)?/i);
        if (wm) {
          const num = parseFloat(wm[1].replace(",", "."));
          const unit = (wm[2] || "г").toLowerCase();
          weight = unit === "кг" || unit === "kg" ? num * 1000 : num;
        }
      }

      if (
        optName.includes("габарит") ||
        optName.includes("размер упаковки") ||
        optName.includes("размеры")
      ) {
        const dm = value.match(
          /([\d.,]+)\s*[xхXХ×*]\s*([\d.,]+)\s*[xхXХ×*]\s*([\d.,]+)/
        );
        if (dm) {
          dimensions = {
            length: parseFloat(dm[1].replace(",", ".")),
            width: parseFloat(dm[2].replace(",", ".")),
            height: parseFloat(dm[3].replace(",", ".")),
          };
        }
      }

      if (optName.includes("длина") && !optName.includes("рукав")) {
        const m = value.match(/([\d.,]+)/);
        if (m) dimL = parseFloat(m[1].replace(",", "."));
      }
      if (optName.includes("ширина")) {
        const m = value.match(/([\d.,]+)/);
        if (m) dimW = parseFloat(m[1].replace(",", "."));
      }
      if (optName.includes("высота") || optName.includes("глубина")) {
        const m = value.match(/([\d.,]+)/);
        if (m) dimH = parseFloat(m[1].replace(",", "."));
      }
    }

    if (!dimensions && dimL && dimW) {
      dimensions = { length: dimL, width: dimW, height: dimH || 1 };
    }
  }

  // ---- 2. Price from basket CDN price-history.json ----
  let price = 0;
  let originalPrice = 0;
  let discount = 0;
  let rating: number | null = null;
  let reviewCount: number | null = null;
  let quantity: number | null = null;

  try {
    const priceUrl = `https://${host}${path}/info/price-history.json`;
    const priceRes = await fetchWithTimeout(
      priceUrl,
      { headers: { Accept: "application/json" } },
      8000
    );

    if (priceRes.ok) {
      const priceHistory = await priceRes.json();
      if (Array.isArray(priceHistory) && priceHistory.length > 0) {
        // Last entry = current price, first entry = original/starting price
        const current = priceHistory[priceHistory.length - 1];
        const first = priceHistory[0];
        price = Math.round((current.price?.RUB || 0) / 100);
        originalPrice = Math.round((first.price?.RUB || 0) / 100);
        // Find the max historical price as "original" for discount calc
        const maxHistorical = Math.max(
          ...priceHistory.map((e: any) => e.price?.RUB || 0)
        );
        if (maxHistorical > 0) {
          originalPrice = Math.round(maxHistorical / 100);
        }
      }
    }
  } catch {
    // Price history unavailable
  }

  // Fallback: try search API for price + rating
  if (!price) {
    try {
      const searchUrl = `https://search.wb.ru/exactmatch/ru/common/v9/search?appType=1&curr=rub&dest=-1257786&query=${productId}&resultset=catalog&spp=30`;
      const searchRes = await fetchWithTimeout(
        searchUrl,
        {
          headers: {
            Accept: "application/json",
            Origin: "https://www.wildberries.ru",
            Referer: "https://www.wildberries.ru/",
          },
        },
        10000
      );

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const products = searchData?.data?.products;
        if (products && products.length > 0) {
          const found =
            products.find((p: any) => p.id === nmId) || products[0];
          const salePriceU = found.salePriceU || found.priceU;
          const priceU = found.priceU;
          if (salePriceU) price = Math.round(salePriceU / 100);
          if (priceU) originalPrice = Math.round(priceU / 100);
          discount = found.sale || 0;
          rating = found.reviewRating || found.rating || null;
          reviewCount = found.feedbacks || null;
        }
      }
    } catch {
      // Search API unavailable
    }
  }

  // ---- 3. Product quantity API ----
  try {
    const qntUrl = `https://product-order-qnt.wildberries.ru/by-nm/?nm=${productId}`;
    const qntRes = await fetchWithTimeout(
      qntUrl,
      { headers: { Accept: "application/json" } },
      5000
    );

    if (qntRes.ok) {
      const qntData = await qntRes.json();
      if (Array.isArray(qntData) && qntData.length > 0) {
        quantity = qntData[0].qnt ?? null;
      }
    }
  } catch {
    // Quantity is optional
  }

  if (!originalPrice) originalPrice = price;

  return {
    name,
    brand,
    price,
    originalPrice,
    discount,
    category,
    subcategory,
    weight,
    dimensions,
    images,
    source: "wb",
    sourceUrl: url,
    productId,
    rating,
    reviewCount,
    quantity,
  };
}

// ==========================================================
// OZON PARSER — HTML page parsing (JSON-LD + meta tags)
// ==========================================================

function extractJsonLd(html: string): any[] {
  const results: any[] = [];
  const matches = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
  );
  if (!matches) return results;
  for (const tag of matches) {
    try {
      const json = tag
        .replace(/<script type="application\/ld\+json">/, "")
        .replace(/<\/script>/, "");
      results.push(JSON.parse(json));
    } catch {
      /* skip */
    }
  }
  return results;
}

function extractMeta(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta\\s+(?:property|name)="${property}"\\s+content="([^"]*)"` +
      `|<meta\\s+content="([^"]*)"\\s+(?:property|name)="${property}"`,
    "i"
  );
  const m = html.match(re);
  return m ? m[1] || m[2] || null : null;
}

async function parseOzon(url: string): Promise<ProductData> {
  const match = url.match(/ozon\.ru\/product\/((?:.*?-)?\d+)\/?/);
  if (!match) throw new Error("Не удалось извлечь ID товара из ссылки Ozon");

  const fullSlug = match[1];
  const idMatch = fullSlug.match(/(\d+)$/);
  if (!idMatch) throw new Error("Не удалось извлечь ID товара из ссылки Ozon");
  const productId = idMatch[1];

  let name = "";
  let price = 0;
  let originalPrice = 0;
  let brand = "";
  let images: string[] = [];
  let category = "";
  let rating: number | null = null;
  let reviewCount: number | null = null;

  try {
    const pageRes = await fetchWithTimeout(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        redirect: "follow",
      },
      15000
    );

    if (pageRes.ok) {
      const html = await pageRes.text();

      for (const ld of extractJsonLd(html)) {
        if (ld["@type"] === "Product") {
          name = ld.name || name;
          brand = ld.brand?.name || brand;
          if (ld.image && !images.length) {
            images = (Array.isArray(ld.image) ? ld.image : [ld.image]).slice(
              0,
              5
            );
          }
          if (ld.offers) {
            const offers = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers;
            if (!price) price = parseFloat(offers.price) || 0;
            if (!originalPrice) originalPrice = price;
          }
          if (ld.aggregateRating) {
            rating =
              rating || parseFloat(ld.aggregateRating.ratingValue) || null;
            reviewCount =
              reviewCount ||
              parseInt(ld.aggregateRating.reviewCount) ||
              null;
          }
          if (ld.category) category = category || ld.category;
        }
        if (ld["@type"] === "BreadcrumbList" && ld.itemListElement) {
          const items = ld.itemListElement;
          if (items.length > 1 && !category) {
            category = items[items.length - 1]?.name || "";
          }
        }
      }

      if (!name) {
        const ogTitle = extractMeta(html, "og:title");
        if (ogTitle) name = ogTitle;
      }
      if (!images.length) {
        const ogImage = extractMeta(html, "og:image");
        if (ogImage) images = [ogImage];
      }
      if (!price) {
        const priceMeta = extractMeta(html, "product:price:amount");
        if (priceMeta) price = parseFloat(priceMeta) || 0;
      }
    }
  } catch {
    // Ozon blocked the request
  }

  if (!originalPrice) originalPrice = price;

  if (!name) {
    throw new Error(
      "Не удалось получить данные с Ozon. Сайт блокирует запросы с сервера. Используйте ссылку на Wildberries."
    );
  }

  const discount =
    originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  return {
    name,
    brand,
    price,
    originalPrice,
    discount,
    category,
    subcategory: "",
    weight: null,
    dimensions: null,
    images,
    source: "ozon",
    sourceUrl: url,
    productId,
    rating,
    reviewCount,
    quantity: null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Укажите ссылку на товар" },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();
    let product: ProductData;

    if (trimmedUrl.includes("wildberries.ru")) {
      product = await parseWildberries(trimmedUrl);
    } else if (trimmedUrl.includes("ozon.ru")) {
      product = await parseOzon(trimmedUrl);
    } else {
      return NextResponse.json(
        {
          error: "Поддерживаются только ссылки на Wildberries и Ozon",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Неизвестная ошибка";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
