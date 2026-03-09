import { NextRequest, NextResponse } from "next/server";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DetailedProduct {
  product_id: string;
  title: string;
  brand: string;
  price_range: string;
  min_price: number;
  max_price: number;
  price_tiers: { price: number; min_qty: number }[];
  unit_weight_kg: number | null;
  images: string[];
  sale_quantity: string;
  company_name: string;
  location: string;
  moq: number;
  attributes: Record<string, string>;
  detail_url: string;
  source: "aliexpress";
}

// ─── Common headers to mimic a real browser ─────────────────────────────────

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Referer: "https://www.aliexpress.com/",
};

// ─── Fetch with timeout ─────────────────────────────────────────────────────

function fetchWithTimeout(
  url: string,
  opts: RequestInit = {},
  timeoutMs = 25000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

// ─── Search AliExpress by image URL ─────────────────────────────────────────

async function searchByImage(
  imageUrl: string
): Promise<{ products: DetailedProduct[]; error: string; debug?: any }> {
  console.log("[search-china] Image search for:", imageUrl);

  // AliExpress image search URL — pass image URL as query param
  const encodedImg = encodeURIComponent(imageUrl);
  const searchUrl = `https://www.aliexpress.com/wholesale?SearchText=&catId=0&initiative_id=SB_${Date.now()}&isPremium=y&imgUrl=${encodedImg}`;

  console.log("[search-china] Fetching search page:", searchUrl);

  try {
    const res = await fetchWithTimeout(
      searchUrl,
      {
        headers: BROWSER_HEADERS,
        redirect: "follow",
      },
      30000
    );

    if (!res.ok) {
      console.error("[search-china] HTTP error:", res.status);
      return {
        products: [],
        error: `AliExpress вернул HTTP ${res.status}`,
        debug: { url: searchUrl, status: res.status },
      };
    }

    const html = await res.text();
    console.log("[search-china] Got HTML, length:", html.length);

    // Try to extract products from SSR data
    let products = extractFromSSRData(html);

    // Fallback: parse product links from HTML
    if (products.length === 0) {
      console.log("[search-china] SSR extraction empty, trying link parsing...");
      products = extractFromLinks(html);
    }

    console.log("[search-china] Found products:", products.length);

    return {
      products,
      error: products.length === 0 ? "Товары не найдены в HTML" : "",
      debug: {
        url: searchUrl,
        htmlLength: html.length,
        ssrDataFound: html.includes("__INIT_DATA__") || html.includes("runParams"),
        method: "image-url",
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[search-china] Fetch error:", msg);
    return { products: [], error: msg };
  }
}

// ─── Extract products from AliExpress SSR/embedded JSON data ────────────────

function extractFromSSRData(html: string): DetailedProduct[] {
  // AliExpress embeds data in various global variables
  const patterns = [
    // window.__INIT_DATA__ — most common in modern AliExpress
    /window\.__INIT_DATA__\s*=\s*(\{.+?\})\s*;\s*<\/script>/s,
    // window.runParams — older format
    /window\.runParams\s*=\s*(\{.+?\})\s*;\s*<\/script>/s,
    // _dida_config_
    /_dida_config_\s*=\s*(\{.+?\})\s*;\s*<\/script>/s,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match) continue;

    try {
      const data = JSON.parse(match[1]);
      const items = findProductItems(data);
      if (items.length > 0) {
        console.log("[search-china] Found", items.length, "items in SSR data");
        return parseItems(items).slice(0, 15);
      }
    } catch (e) {
      console.log("[search-china] JSON parse failed for SSR pattern");
    }
  }

  // Also try to find JSON blocks with product data
  const jsonBlockPattern = /"itemList"\s*:\s*(\[[^\]]*\{[^}]*"productId"[^}]*\}[^\]]*\])/s;
  const jsonMatch = html.match(jsonBlockPattern);
  if (jsonMatch) {
    try {
      const items = JSON.parse(jsonMatch[1]);
      if (items.length > 0) {
        console.log("[search-china] Found", items.length, "items in itemList block");
        return parseItems(items).slice(0, 15);
      }
    } catch {
      // ignore
    }
  }

  return [];
}

// ─── Recursively find product item arrays in nested data ────────────────────

function findProductItems(obj: any, depth = 0): any[] {
  if (depth > 10 || !obj || typeof obj !== "object") return [];

  // Check known keys for product arrays
  const keys = ["items", "itemList", "productList", "products", "resultList"];
  for (const key of keys) {
    if (Array.isArray(obj[key]) && obj[key].length > 0) {
      const first = obj[key][0];
      if (first && typeof first === "object" && hasProductFields(first)) {
        return obj[key];
      }
    }
  }

  // AliExpress "mods" structure
  if (obj.mods && typeof obj.mods === "object") {
    for (const modKey of Object.keys(obj.mods)) {
      const mod = obj.mods[modKey];
      if (mod?.content && Array.isArray(mod.content) && mod.content.length > 0) {
        if (hasProductFields(mod.content[0])) {
          return mod.content;
        }
      }
    }
  }

  // Recurse
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      const found = findProductItems(obj[key], depth + 1);
      if (found.length > 0) return found;
    }
  }

  return [];
}

function hasProductFields(obj: any): boolean {
  return !!(
    obj.title ||
    obj.productTitle ||
    obj.product_title ||
    obj.productId ||
    obj.product_id ||
    obj.itemId ||
    obj.prices
  );
}

// ─── Parse product items into DetailedProduct[] ─────────────────────────────

function parseItems(items: any[]): DetailedProduct[] {
  return items
    .map((item: any): DetailedProduct | null => {
      const productId = String(
        item.productId || item.product_id || item.itemId || item.item_id || item.id || ""
      );
      if (!productId) return null;

      // Title
      const title =
        item.title?.displayTitle ||
        item.title?.seoTitle ||
        (typeof item.title === "string" ? item.title : "") ||
        item.product_title ||
        item.productTitle ||
        item.name ||
        "";

      // Price
      let price = 0;
      let maxPrice = 0;
      if (item.prices) {
        const sp = item.prices.salePrice;
        if (sp) {
          price = parseFloat(sp.minPrice || sp.formattedPrice?.replace(/[^0-9.]/g, "") || "0") || 0;
          maxPrice = parseFloat(sp.maxPrice || "0") || price;
        }
        const op = item.prices.originalPrice;
        if (op && !maxPrice) {
          maxPrice = parseFloat(op.minPrice || op.formattedPrice?.replace(/[^0-9.]/g, "") || "0") || price;
        }
      } else {
        const raw = item.price || item.salePrice || item.sale_price || item.min_price || "0";
        price = typeof raw === "string" ? parseFloat(raw.replace(/[^0-9.]/g, "")) || 0 : parseFloat(raw) || 0;
        maxPrice = price;
      }

      // Image
      const images: string[] = [];
      const imgUrl =
        item.image?.imgUrl ||
        item.imageUrl ||
        item.image_url ||
        item.product_main_image_url ||
        (typeof item.image === "string" ? item.image : "") ||
        "";
      if (imgUrl) {
        images.push(imgUrl.startsWith("//") ? "https:" + imgUrl : imgUrl);
      }

      // Sales
      const salesCount =
        item.trade?.tradeDesc ||
        item.trade?.sold ||
        (item.lastest_volume != null ? String(item.lastest_volume) : "") ||
        (item.orders != null ? String(item.orders) : "") ||
        "";

      // Store
      const storeName =
        item.store?.storeName || item.shop_name || item.shopName || item.seller_name || "";

      // Location
      const location =
        item.logistics?.shipFrom || item.ship_from || item.shipFrom || item.location || "";

      return {
        product_id: productId,
        title,
        brand: item.brand || "",
        price_range: price > 0 ? `$${price.toFixed(2)}` : "N/A",
        min_price: price,
        max_price: maxPrice || price,
        price_tiers: price > 0 ? [{ price, min_qty: 1 }] : [],
        unit_weight_kg: null,
        images,
        sale_quantity: salesCount,
        company_name: storeName,
        location,
        moq: 1,
        attributes: {},
        detail_url:
          item.productDetailUrl ||
          item.product_detail_url ||
          item.detail_url ||
          `https://www.aliexpress.com/item/${productId}.html`,
        source: "aliexpress" as const,
      };
    })
    .filter(
      (p: DetailedProduct | null): p is DetailedProduct =>
        p !== null && (!!p.title || p.min_price > 0)
    );
}

// ─── Extract products from <a> links in HTML (fallback) ─────────────────────

function extractFromLinks(html: string): DetailedProduct[] {
  const products: DetailedProduct[] = [];
  const seenIds = new Set<string>();

  const linkPattern =
    /<a[^>]+href=["']([^"']*\/item\/(\d+)\.html[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match;
  while ((match = linkPattern.exec(html)) !== null && products.length < 15) {
    const [, href, productId, inner] = match;
    if (seenIds.has(productId)) continue;
    seenIds.add(productId);

    // Title from alt/title attributes or text content
    const titleMatch = inner.match(
      /(?:title|alt)=["']([^"']+)["']|<(?:h[1-6]|span|div)[^>]*>([^<]{10,})<\//i
    );
    const title = titleMatch ? (titleMatch[1] || titleMatch[2] || "").trim() : "";

    // Price
    const priceMatch = inner.match(
      /(?:US\s*\$|USD\s*)\s*([\d,.]+)|(\d+[.,]\d{2})\s*(?:USD|\$)/i
    );
    const price = priceMatch
      ? parseFloat((priceMatch[1] || priceMatch[2]).replace(",", "."))
      : 0;

    // Image
    const imgMatch = inner.match(
      /(?:src|data-src)=["']((?:https?:)?\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i
    );
    let imgSrc = imgMatch ? imgMatch[1] : "";
    if (imgSrc.startsWith("//")) imgSrc = "https:" + imgSrc;

    if (title || price > 0) {
      products.push({
        product_id: productId,
        title,
        brand: "",
        price_range: price > 0 ? `$${price.toFixed(2)}` : "N/A",
        min_price: price,
        max_price: price,
        price_tiers: price > 0 ? [{ price, min_qty: 1 }] : [],
        unit_weight_kg: null,
        images: imgSrc ? [imgSrc] : [],
        sale_quantity: "",
        company_name: "",
        location: "",
        moq: 1,
        attributes: {},
        detail_url: href.startsWith("http")
          ? href
          : `https://www.aliexpress.com/item/${productId}.html`,
        source: "aliexpress",
      });
    }
  }

  return products;
}

// ─── Diagnostic GET endpoint ─────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    method: "image-search-scraping",
    status: "ready",
    description: "Поиск по фото на AliExpress через парсинг HTML",
  });
}

// ─── Main POST Handler ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Не передана ссылка на изображение" },
        { status: 400 }
      );
    }

    console.log("[search-china] Starting image search...");
    console.log("[search-china] imageUrl:", imageUrl);

    const result = await searchByImage(imageUrl);

    return NextResponse.json({
      searchMethod: "image" as const,
      totalFound: result.products.length,
      products: result.products,
      ...(result.products.length === 0
        ? {
            debug: {
              imageUrl,
              method: "image-url-scraping",
              errorAliexpress: result.error || "Товары не найдены",
              foundAliexpress: 0,
              ...result.debug,
            },
          }
        : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("[search-china] Handler error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
