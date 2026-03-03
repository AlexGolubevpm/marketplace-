import { NextRequest, NextResponse } from "next/server";

// --- WB Helpers ---

function getWbBasketHost(id: number): string {
  const vol = Math.floor(id / 100000);
  let basket: string;
  if (vol <= 143) basket = "01";
  else if (vol <= 287) basket = "02";
  else if (vol <= 431) basket = "03";
  else if (vol <= 719) basket = "04";
  else if (vol <= 1007) basket = "05";
  else if (vol <= 1061) basket = "06";
  else if (vol <= 1115) basket = "07";
  else if (vol <= 1169) basket = "08";
  else if (vol <= 1313) basket = "09";
  else if (vol <= 1601) basket = "10";
  else if (vol <= 1655) basket = "11";
  else if (vol <= 1919) basket = "12";
  else if (vol <= 2045) basket = "13";
  else if (vol <= 2189) basket = "14";
  else if (vol <= 2405) basket = "15";
  else if (vol <= 2621) basket = "16";
  else if (vol <= 2837) basket = "17";
  else if (vol <= 3053) basket = "18";
  else if (vol <= 3269) basket = "19";
  else if (vol <= 3485) basket = "20";
  else if (vol <= 3701) basket = "21";
  else if (vol <= 3917) basket = "22";
  else if (vol <= 4133) basket = "23";
  else if (vol <= 4349) basket = "24";
  else if (vol <= 4565) basket = "25";
  else basket = "26";

  return `basket-${basket}.wbbasket.ru`;
}

function getWbImageUrl(id: number, photoIndex: number = 1): string {
  const vol = Math.floor(id / 100000);
  const part = Math.floor(id / 1000);
  const host = getWbBasketHost(id);
  return `https://${host}/vol${vol}/part${part}/${id}/images/big/${photoIndex}.webp`;
}

function getWbCardInfoUrl(id: number): string {
  const vol = Math.floor(id / 100000);
  const part = Math.floor(id / 1000);
  const host = getWbBasketHost(id);
  return `https://${host}/vol${vol}/part${part}/${id}/info/ru/card.json`;
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

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
};

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

// --- Shared HTML parsing helpers ---

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
      /* skip invalid JSON */
    }
  }
  return results;
}

function extractMeta(html: string, property: string): string | null {
  // Handles both property="..." content="..." and content="..." property="..."
  const re = new RegExp(
    `<meta\\s+(?:property|name)="${property}"\\s+content="([^"]*)"` +
      `|<meta\\s+content="([^"]*)"\\s+(?:property|name)="${property}"`,
    "i"
  );
  const m = html.match(re);
  return m ? m[1] || m[2] || null : null;
}

// --- WB: parse card info from basket (category, weight, dimensions) ---

async function fetchWbCardInfo(nmId: number) {
  let category = "";
  let subcategory = "";
  let weight: number | null = null;
  let dimensions: { length: number; width: number; height: number } | null =
    null;

  try {
    const cardInfoUrl = getWbCardInfoUrl(nmId);
    const res = await fetchWithTimeout(cardInfoUrl, {
      headers: { Accept: "application/json" },
    }, 10000);

    if (!res.ok) return { category, subcategory, weight, dimensions };

    const cardInfo = await res.json();
    category = cardInfo.subj_root_name || "";
    subcategory = cardInfo.subj_name || "";

    if (cardInfo.options && Array.isArray(cardInfo.options)) {
      let dimL: number | null = null;
      let dimW: number | null = null;
      let dimH: number | null = null;

      for (const opt of cardInfo.options) {
        const name = (opt.name || "").toLowerCase();
        const value = opt.value || "";

        if ((name.includes("вес") || name === "weight") && !weight) {
          const wm = value.match(/([\d.,]+)\s*(кг|г|гр|kg|g)?/i);
          if (wm) {
            const num = parseFloat(wm[1].replace(",", "."));
            const unit = (wm[2] || "г").toLowerCase();
            weight = unit === "кг" || unit === "kg" ? num * 1000 : num;
          }
        }

        if (
          name.includes("габарит") ||
          name.includes("размер упаковки") ||
          name.includes("размеры")
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

        if (name.includes("длина") && !name.includes("рукав")) {
          const m = value.match(/([\d.,]+)/);
          if (m) dimL = parseFloat(m[1].replace(",", "."));
        }
        if (name.includes("ширина")) {
          const m = value.match(/([\d.,]+)/);
          if (m) dimW = parseFloat(m[1].replace(",", "."));
        }
        if (name.includes("высота") || name.includes("глубина")) {
          const m = value.match(/([\d.,]+)/);
          if (m) dimH = parseFloat(m[1].replace(",", "."));
        }
      }

      if (!dimensions && dimL && dimW) {
        dimensions = { length: dimL, width: dimW, height: dimH || 1 };
      }
    }
  } catch {
    /* card info is optional */
  }

  return { category, subcategory, weight, dimensions };
}

// ==========================================================
// WB PARSER — HTML page first, API endpoints as fallback
// ==========================================================

async function parseWildberries(url: string): Promise<ProductData> {
  const match = url.match(/wildberries\.ru\/catalog\/(\d+)/);
  if (!match) throw new Error("Не удалось извлечь ID товара из ссылки WB");

  const productId = match[1];
  const nmId = parseInt(productId, 10);

  let name = "";
  let brand = "";
  let price = 0;
  let originalPrice = 0;
  let discount = 0;
  let images: string[] = [];
  let rating: number | null = null;
  let reviewCount: number | null = null;
  let quantity: number | null = null;

  // ---- Strategy 1: Parse the WB product page HTML ----
  // WB server-renders JSON-LD and meta tags — reliable, no API needed
  try {
    const pageUrl = `https://www.wildberries.ru/catalog/${productId}/detail.aspx`;
    const pageRes = await fetchWithTimeout(
      pageUrl,
      { headers: BROWSER_HEADERS, redirect: "follow" },
      15000
    );

    if (pageRes.ok) {
      const html = await pageRes.text();

      // JSON-LD structured data
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
            if (!originalPrice)
              originalPrice = parseFloat(offers.highPrice || offers.price) || price;
          }
          if (ld.aggregateRating) {
            rating =
              rating || parseFloat(ld.aggregateRating.ratingValue) || null;
            reviewCount =
              reviewCount ||
              parseInt(ld.aggregateRating.reviewCount) ||
              null;
          }
        }
        if (ld["@type"] === "BreadcrumbList" && ld.itemListElement) {
          // category info available from breadcrumbs — we'll get it from card.json instead
        }
      }

      // Fallback: meta tags
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
    // HTML strategy failed, continue to API
  }

  // ---- Strategy 2: Try WB card API endpoints (multiple variations) ----
  if (!name || !price) {
    const apiUrls = [
      `https://card.wb.ru/cards/v2/detail?appType=1&curr=rub&dest=-1257786&nm=${productId}`,
      `https://card.wb.ru/cards/v1/detail?appType=1&curr=rub&dest=-1257786&nm=${productId}`,
      `https://card.wb.ru/cards/detail?appType=1&curr=rub&dest=-1257786&nm=${productId}`,
    ];

    for (const apiUrl of apiUrls) {
      try {
        const res = await fetchWithTimeout(
          apiUrl,
          { headers: { Accept: "application/json" } },
          10000
        );
        if (!res.ok) continue;

        const data = await res.json();
        const products = data?.data?.products;
        if (!products || products.length === 0) continue;

        const product = products[0];
        if (!name) name = product.name || "";
        if (!brand) brand = product.brand || "";

        if (!price) {
          const salePriceU = product.salePriceU || product.priceU;
          price = salePriceU ? Math.round(salePriceU / 100) : 0;
        }
        if (!originalPrice) {
          originalPrice = product.priceU
            ? Math.round(product.priceU / 100)
            : price;
        }
        if (!discount) discount = product.sale || 0;
        if (!rating) rating = product.reviewRating || product.rating || null;
        if (!reviewCount) reviewCount = product.feedbacks || null;
        quantity = product.totalQuantity || null;

        if (!images.length) {
          const picCount = product.pics || 1;
          for (let i = 1; i <= Math.min(picCount, 5); i++) {
            images.push(getWbImageUrl(nmId, i));
          }
        }
        break; // success — stop trying
      } catch {
        continue;
      }
    }
  }

  // ---- Images fallback: generate from basket CDN ----
  if (!images.length) {
    for (let i = 1; i <= 3; i++) {
      images.push(getWbImageUrl(nmId, i));
    }
  }

  if (!name) {
    throw new Error(
      "Не удалось получить данные товара с WB. Проверьте ссылку и попробуйте ещё раз."
    );
  }

  if (!originalPrice) originalPrice = price;
  if (!discount && originalPrice > price) {
    discount = Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  // ---- Fetch card info (category, weight, dimensions) from basket ----
  const cardInfo = await fetchWbCardInfo(nmId);

  return {
    name,
    brand,
    price,
    originalPrice,
    discount,
    category: cardInfo.category,
    subcategory: cardInfo.subcategory,
    weight: cardInfo.weight,
    dimensions: cardInfo.dimensions,
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

  // ---- Fetch Ozon product page HTML ----
  try {
    const pageRes = await fetchWithTimeout(
      url,
      { headers: BROWSER_HEADERS, redirect: "follow" },
      15000
    );

    if (pageRes.ok) {
      const html = await pageRes.text();

      // JSON-LD structured data
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

      // Fallback: meta tags
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
    // Ozon likely blocked the request
  }

  if (!originalPrice) originalPrice = price;

  if (!name) {
    throw new Error(
      "Не удалось получить данные с Ozon. Сайт блокирует запросы с сервера. Попробуйте ссылку на Wildberries."
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
