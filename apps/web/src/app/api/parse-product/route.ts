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

function getWbCardJsonUrl(id: number): string {
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

  // ---- 1. Basket CDN card.json — primary source for product info ----
  // This is a static file on CDN, no antibot, always accessible
  const cardJsonUrl = getWbCardJsonUrl(nmId);
  let cardRes: Response;
  try {
    cardRes = await fetchWithTimeout(cardJsonUrl, {
      headers: { Accept: "application/json" },
    }, 10000);
  } catch (err) {
    throw new Error(
      `Не удалось загрузить данные товара с WB CDN. ${err instanceof Error ? err.message : "Сеть недоступна"}`
    );
  }

  if (!cardRes.ok) {
    throw new Error(
      "Товар не найден на WB. Проверьте ссылку — возможно товар удалён."
    );
  }

  const card = await cardRes.json();

  const name = card.imt_name || "";
  const brand = card.selling?.brand_name || "";
  const category = card.subj_root_name || "";
  const subcategory = card.subj_name || "";
  const photoCount = card.media?.photo_count || 1;

  if (!name) {
    throw new Error("Не удалось получить название товара с WB.");
  }

  // Generate image URLs from basket CDN
  const images: string[] = [];
  for (let i = 1; i <= Math.min(photoCount, 5); i++) {
    images.push(getWbImageUrl(nmId, i));
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

  // ---- 2. Search API — for price and rating ----
  // search.wb.ru returns product data including price when searching by nm_id
  let price = 0;
  let originalPrice = 0;
  let discount = 0;
  let rating: number | null = null;
  let reviewCount: number | null = null;
  let quantity: number | null = null;

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
        // Find our exact product by nmId
        const found = products.find((p: any) => p.id === nmId) || products[0];
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
    // Search API unavailable — price will be 0
  }

  // ---- 3. Product quantity API ----
  try {
    const qntUrl = `https://product-order-qnt.wildberries.ru/by-nm/?nm=${productId}`;
    const qntRes = await fetchWithTimeout(qntUrl, {
      headers: { Accept: "application/json" },
    }, 5000);

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
// Note: Ozon blocks most server IPs. This will only work
// if the server IP is not blocked by Ozon's CDN.
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

  // Fetch Ozon product page HTML
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
    // Ozon likely blocked the request
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
