import { NextRequest, NextResponse } from "next/server";

// ─── Config ─────────────────────────────────────────────────────────────────

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const ALIEXPRESS_HOST =
  process.env.RAPIDAPI_HOST_ALIEXPRESS || "aliexpress-datahub.p.rapidapi.com";

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

// ─── Fetch with timeout ─────────────────────────────────────────────────────

function fetchWithTimeout(
  url: string,
  opts: RequestInit = {},
  timeoutMs = 20000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

// ─── Parse AliExpress DataHub items ─────────────────────────────────────────

function parseAliExpressItems(data: any): DetailedProduct[] {
  let items: any[] = [];

  if (Array.isArray(data)) {
    items = data;
  } else if (data?.result && Array.isArray(data.result)) {
    items = data.result;
  } else if (data?.data && Array.isArray(data.data)) {
    items = data.data;
  } else if (data?.items && Array.isArray(data.items)) {
    items = data.items;
  } else if (data?.result?.items && Array.isArray(data.result.items)) {
    items = data.result.items;
  } else if (
    data?.result?.resultList &&
    Array.isArray(data.result.resultList)
  ) {
    items = data.result.resultList;
  }

  return items.slice(0, 20).map((item: any) => {
    const rawPrice =
      item.price ||
      item.salePrice ||
      item.sale_price ||
      item.min_price ||
      item.app_sale_price ||
      "0";
    const price =
      typeof rawPrice === "string"
        ? parseFloat(rawPrice.replace(/[^0-9.]/g, "")) || 0
        : parseFloat(rawPrice) || 0;

    const rawMaxPrice =
      item.originalPrice ||
      item.original_price ||
      item.max_price ||
      item.priceMax ||
      rawPrice;
    const maxPrice =
      typeof rawMaxPrice === "string"
        ? parseFloat(rawMaxPrice.replace(/[^0-9.]/g, "")) || price
        : parseFloat(rawMaxPrice) || price;

    const images: string[] = [];
    const mainImg =
      item.product_main_image_url ||
      item.productMainImageUrl ||
      item.imageUrl ||
      item.image_url ||
      item.pic_url ||
      item.image ||
      item.img ||
      "";
    if (mainImg) {
      images.push(mainImg.startsWith("//") ? "https:" + mainImg : mainImg);
    }
    if (item.product_small_image_urls) {
      const smallImgs = Array.isArray(item.product_small_image_urls)
        ? item.product_small_image_urls
        : item.product_small_image_urls?.string || [];
      for (const img of smallImgs) {
        const u = typeof img === "string" ? img : img.url || "";
        if (u && !images.includes(u)) {
          images.push(u.startsWith("//") ? "https:" + u : u);
        }
      }
    }
    if (item.images && Array.isArray(item.images)) {
      for (const img of item.images.slice(0, 5)) {
        const u = typeof img === "string" ? img : img.url || img.src || "";
        if (u && !images.includes(u)) {
          images.push(u.startsWith("//") ? "https:" + u : u);
        }
      }
    }

    const itemId = String(
      item.product_id ||
        item.productId ||
        item.item_id ||
        item.itemId ||
        item.id ||
        ""
    );

    return {
      product_id: itemId,
      title:
        item.product_title ||
        item.productTitle ||
        item.title ||
        item.name ||
        "",
      brand: item.brand || item.brandName || "",
      price_range: price > 0 ? `$${price.toFixed(2)}` : "0",
      min_price: price,
      max_price: maxPrice,
      price_tiers: [{ price, min_qty: 1 }],
      unit_weight_kg: null,
      images: images.slice(0, 6),
      sale_quantity:
        item.lastest_volume != null
          ? String(item.lastest_volume)
          : item.sales != null
            ? String(item.sales)
            : item.orders != null
              ? String(item.orders)
              : item.trade_count != null
                ? String(item.trade_count)
                : "",
      company_name:
        item.shop_name ||
        item.shopName ||
        item.seller_name ||
        item.sellerName ||
        item.store_name ||
        "",
      location:
        item.ship_from || item.shipFrom || item.location || item.country || "",
      moq: parseInt(item.moq || item.min_order || "1") || 1,
      attributes: {},
      detail_url:
        item.product_detail_url ||
        item.productDetailUrl ||
        item.detail_url ||
        item.item_url ||
        item.url ||
        `https://www.aliexpress.com/item/${itemId}.html`,
      source: "aliexpress" as const,
    };
  });
}

// ─── AliExpress DataHub: image search ───────────────────────────────────────

async function searchByImageAPI(
  imageUrl: string
): Promise<{ products: DetailedProduct[]; error: string }> {
  const params = new URLSearchParams({ image_url: imageUrl });
  const url = `https://${ALIEXPRESS_HOST}/image_search?${params.toString()}`;
  console.log("[search-china] AliExpress image API →", url);

  const res = await fetchWithTimeout(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": ALIEXPRESS_HOST,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[search-china] AliExpress image HTTP error:", res.status, body);
    return { products: [], error: `HTTP ${res.status}: ${body.slice(0, 300)}` };
  }

  const data = await res.json();
  console.log(
    "[search-china] AliExpress image response keys:",
    typeof data === "object" && data ? Object.keys(data) : typeof data
  );

  if (data?.error || data?.message) {
    const errMsg = data.error || data.message;
    console.error("[search-china] AliExpress API error:", errMsg);
    return { products: [], error: String(errMsg) };
  }

  const products = parseAliExpressItems(data);
  console.log("[search-china] AliExpress image parsed:", products.length);
  return { products, error: "" };
}

// ─── AliExpress DataHub: text search ────────────────────────────────────────

async function searchByTextAPI(
  query: string
): Promise<{ products: DetailedProduct[]; error: string }> {
  const params = new URLSearchParams({
    q: query,
    page: "1",
    sort: "default",
  });
  const url = `https://${ALIEXPRESS_HOST}/item_search_2?${params.toString()}`;
  console.log("[search-china] AliExpress text API →", url);

  const res = await fetchWithTimeout(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": ALIEXPRESS_HOST,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[search-china] AliExpress text HTTP error:", res.status, body);
    return { products: [], error: `HTTP ${res.status}: ${body.slice(0, 300)}` };
  }

  const data = await res.json();
  if (data?.error || (data?.message && !data?.result)) {
    return { products: [], error: String(data.error || data.message) };
  }

  const products = parseAliExpressItems(data);
  console.log("[search-china] AliExpress text parsed:", products.length);
  return { products, error: "" };
}

// ─── Scrape AliExpress search page (fallback, no API key needed) ────────────

async function scrapeAliExpressSearch(
  query: string
): Promise<{ products: DetailedProduct[]; error: string }> {
  console.log("[search-china] Scraping AliExpress search for:", query);

  const encodedQuery = encodeURIComponent(query);
  const searchUrl = `https://www.aliexpress.com/wholesale?SearchText=${encodedQuery}&sortType=total_tranpro_desc`;

  try {
    const res = await fetchWithTimeout(
      searchUrl,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
        },
        redirect: "follow",
      },
      25000
    );

    if (!res.ok) {
      return { products: [], error: `AliExpress HTTP ${res.status}` };
    }

    const html = await res.text();

    // AliExpress embeds product data in window._dida_config_ or window.runParams
    // or in JSON inside script tags
    const products = extractProductsFromHtml(html);

    console.log("[search-china] Scraped products:", products.length);
    return { products, error: "" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[search-china] Scrape error:", msg);
    return { products: [], error: msg };
  }
}

// ─── Extract products from AliExpress HTML ──────────────────────────────────

function extractProductsFromHtml(html: string): DetailedProduct[] {
  const products: DetailedProduct[] = [];

  // Method 1: Extract from SSR data (window.__INIT_DATA__ or _dida_config_)
  const dataPatterns = [
    /window\.__INIT_DATA__\s*=\s*(\{[\s\S]*?\});\s*(?:<\/script>|window\.)/,
    /window\.runParams\s*=\s*(\{[\s\S]*?\});\s*(?:<\/script>|window\.)/,
    /_dida_config_\s*=\s*(\{[\s\S]*?\});\s*(?:<\/script>|window\.)/,
    /data:\s*(\{[\s\S]*?"items"[\s\S]*?\})\s*[,;]/,
  ];

  for (const pattern of dataPatterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        const data = JSON.parse(match[1]);
        const items = findItemsInObject(data);
        if (items.length > 0) {
          return parseScrapedItems(items).slice(0, 15);
        }
      } catch {
        // JSON parse failed, try next pattern
      }
    }
  }

  // Method 2: Parse product links directly from HTML with regex
  const linkPattern =
    /<a[^>]+href=["']([^"']*\/item\/(\d+)\.html[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const seenIds = new Set<string>();
  let linkMatch;

  while ((linkMatch = linkPattern.exec(html)) !== null && products.length < 15) {
    const [, href, productId, innerHtml] = linkMatch;
    if (seenIds.has(productId)) continue;
    seenIds.add(productId);

    // Extract title from inner content
    const titleMatch = innerHtml.match(
      /(?:title|alt)=["']([^"']+)["']|<(?:h[1-6]|span|div)[^>]*>([^<]{10,})<\//i
    );
    const title = titleMatch
      ? (titleMatch[1] || titleMatch[2] || "").trim()
      : "";

    // Extract price
    const priceMatch = innerHtml.match(
      /(?:US\s*\$|USD\s*)\s*([\d,.]+)|(\d+[.,]\d{2})\s*(?:USD|\$)/i
    );
    const price = priceMatch
      ? parseFloat((priceMatch[1] || priceMatch[2]).replace(",", "."))
      : 0;

    // Extract image
    const imgMatch = innerHtml.match(
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

// ─── Recursively find items array in nested object ──────────────────────────

function findItemsInObject(obj: any, depth = 0): any[] {
  if (depth > 8 || !obj || typeof obj !== "object") return [];

  // Check common property names for item arrays
  const itemKeys = [
    "items",
    "itemList",
    "productList",
    "products",
    "resultList",
    "mods",
  ];

  for (const key of itemKeys) {
    if (Array.isArray(obj[key]) && obj[key].length > 0) {
      // Validate that these look like products
      const first = obj[key][0];
      if (
        first &&
        typeof first === "object" &&
        (first.title ||
          first.productTitle ||
          first.product_title ||
          first.name ||
          first.productId ||
          first.product_id ||
          first.itemId)
      ) {
        return obj[key];
      }
    }
  }

  // Special handling for AliExpress mods structure
  if (obj.mods && typeof obj.mods === "object") {
    for (const modKey of Object.keys(obj.mods)) {
      const mod = obj.mods[modKey];
      if (mod?.content && Array.isArray(mod.content)) {
        const first = mod.content[0];
        if (first && (first.title || first.productId || first.prices)) {
          return mod.content;
        }
      }
    }
  }

  // Recurse into object properties
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      const found = findItemsInObject(obj[key], depth + 1);
      if (found.length > 0) return found;
    }
  }

  return [];
}

// ─── Parse scraped items into DetailedProduct ───────────────────────────────

function parseScrapedItems(items: any[]): DetailedProduct[] {
  return (items
    .map((item: any): DetailedProduct | null => {
      const productId = String(
        item.productId ||
          item.product_id ||
          item.itemId ||
          item.item_id ||
          item.id ||
          ""
      );
      if (!productId) return null;

      const title =
        item.title?.displayTitle ||
        item.title?.seoTitle ||
        (typeof item.title === "string" ? item.title : "") ||
        item.product_title ||
        item.productTitle ||
        item.name ||
        "";

      // Price extraction from various structures
      let price = 0;
      let maxPrice = 0;
      if (item.prices) {
        const salePrice = item.prices.salePrice;
        if (salePrice) {
          price =
            parseFloat(salePrice.minPrice || salePrice.formattedPrice?.replace(/[^0-9.]/g, "") || "0") || 0;
          maxPrice =
            parseFloat(salePrice.maxPrice || "0") || price;
        }
        const origPrice = item.prices.originalPrice;
        if (origPrice && !maxPrice) {
          maxPrice =
            parseFloat(origPrice.minPrice || origPrice.formattedPrice?.replace(/[^0-9.]/g, "") || "0") || price;
        }
      } else {
        const rawPrice =
          item.price ||
          item.salePrice ||
          item.sale_price ||
          item.min_price ||
          "0";
        price =
          typeof rawPrice === "string"
            ? parseFloat(rawPrice.replace(/[^0-9.]/g, "")) || 0
            : parseFloat(rawPrice) || 0;
        maxPrice = price;
      }

      // Images
      const images: string[] = [];
      const imgUrl =
        item.image?.imgUrl ||
        item.imageUrl ||
        item.image_url ||
        item.product_main_image_url ||
        (typeof item.image === "string" ? item.image : "") ||
        "";
      if (imgUrl) {
        let src = imgUrl;
        if (src.startsWith("//")) src = "https:" + src;
        images.push(src);
      }

      // Sales
      const tradeDesc =
        item.trade?.tradeDesc ||
        item.trade?.sold ||
        "";
      const salesCount =
        item.lastest_volume != null
          ? String(item.lastest_volume)
          : item.orders != null
            ? String(item.orders)
            : tradeDesc || "";

      // Store
      const storeName =
        item.store?.storeName ||
        item.shop_name ||
        item.shopName ||
        item.seller_name ||
        "";

      // Shipping
      const location =
        item.logistics?.shipFrom ||
        item.ship_from ||
        item.shipFrom ||
        item.location ||
        "";

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
    .filter((p: DetailedProduct | null): p is DetailedProduct => p !== null && (!!p.title || p.min_price > 0)));
}

// ─── Fetch product details from AliExpress ──────────────────────────────────

async function fetchProductDetails(
  productId: string
): Promise<Partial<DetailedProduct> | null> {
  if (!RAPIDAPI_KEY) return null;

  try {
    const params = new URLSearchParams({ itemId: productId, currency: "USD" });
    const url = `https://${ALIEXPRESS_HOST}/item_detail_3?${params.toString()}`;

    const res = await fetchWithTimeout(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": ALIEXPRESS_HOST,
      },
    }, 10000);

    if (!res.ok) return null;

    const data = await res.json();
    const result = data?.result || data?.data || data;

    if (!result) return null;

    // Parse price tiers from SKU info
    const priceTiers: { price: number; min_qty: number }[] = [];
    if (result.skus || result.sku_info) {
      const skus = result.skus || result.sku_info?.price_list || [];
      for (const sku of (Array.isArray(skus) ? skus : [])) {
        const skuPrice = parseFloat(
          sku.skuVal?.skuActivityAmount?.value ||
            sku.skuVal?.skuAmount?.value ||
            sku.price ||
            "0"
        );
        if (skuPrice > 0 && !priceTiers.find((t) => t.price === skuPrice)) {
          priceTiers.push({ price: skuPrice, min_qty: sku.skuVal?.bulkOrder || 1 });
        }
      }
    }

    // Parse weight
    let weightKg: number | null = null;
    const packageInfo = result.packageInfo || result.package_info;
    if (packageInfo) {
      const w = parseFloat(packageInfo.packageWeight || packageInfo.weight || "0");
      if (w > 0) {
        weightKg = packageInfo.weightUnit === "gram" ? w / 1000 : w;
      }
    }

    // Parse attributes
    const attributes: Record<string, string> = {};
    const specs = result.specs || result.properties || [];
    for (const spec of (Array.isArray(specs) ? specs : [])) {
      const name = spec.attrName || spec.name || spec.key || "";
      const value = spec.attrValue || spec.value || "";
      if (name && value) attributes[name] = value;
    }

    // More images
    const images: string[] = [];
    const imgList = result.imagePathList || result.images || [];
    for (const img of (Array.isArray(imgList) ? imgList : [])) {
      let src = typeof img === "string" ? img : img.url || "";
      if (src.startsWith("//")) src = "https:" + src;
      if (src) images.push(src);
    }

    return {
      price_tiers: priceTiers.length > 0 ? priceTiers : undefined,
      unit_weight_kg: weightKg,
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      images: images.length > 0 ? images : undefined,
      company_name: result.storeName || result.store_name || undefined,
      location: result.shipFrom || result.ship_from || undefined,
    };
  } catch (e) {
    console.error("[search-china] Detail fetch error:", e);
    return null;
  }
}

// ─── Enrich top products with details ───────────────────────────────────────

async function enrichProducts(
  products: DetailedProduct[],
  maxEnrich = 3
): Promise<DetailedProduct[]> {
  if (!RAPIDAPI_KEY || products.length === 0) return products;

  const toEnrich = products.slice(0, maxEnrich);
  const detailResults = await Promise.allSettled(
    toEnrich.map((p) => fetchProductDetails(p.product_id))
  );

  return products.map((product, i) => {
    if (i >= maxEnrich) return product;

    const result = detailResults[i];
    if (result.status !== "fulfilled" || !result.value) return product;

    const details = result.value;
    return {
      ...product,
      price_tiers: details.price_tiers || product.price_tiers,
      unit_weight_kg: details.unit_weight_kg ?? product.unit_weight_kg,
      attributes: details.attributes
        ? { ...product.attributes, ...details.attributes }
        : product.attributes,
      images:
        details.images && details.images.length > product.images.length
          ? details.images.slice(0, 6)
          : product.images,
      company_name: details.company_name || product.company_name,
      location: details.location || product.location,
    };
  });
}

// ─── Diagnostic GET endpoint ─────────────────────────────────────────────────

export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    config: {
      aliexpressHost: ALIEXPRESS_HOST,
      rapidApiKeySet: !!RAPIDAPI_KEY,
      rapidApiKeyLen: RAPIDAPI_KEY.length,
    },
    tests: {} as Record<string, any>,
  };

  // Test: AliExpress text search
  if (RAPIDAPI_KEY) {
    try {
      const params = new URLSearchParams({
        q: "test",
        page: "1",
        sort: "default",
      });
      const url = `https://${ALIEXPRESS_HOST}/item_search_2?${params.toString()}`;
      const res = await fetchWithTimeout(
        url,
        {
          method: "GET",
          headers: {
            "x-rapidapi-key": RAPIDAPI_KEY,
            "x-rapidapi-host": ALIEXPRESS_HOST,
          },
        },
        15000
      );
      const body = await res.text().catch(() => "");
      let parsed: any = null;
      try {
        parsed = JSON.parse(body);
      } catch {
        /* not json */
      }
      const products = parsed ? parseAliExpressItems(parsed) : [];
      diagnostics.tests.textSearch = {
        status: res.ok ? "OK" : "FAIL",
        httpStatus: res.status,
        itemsFound: products.length,
        error: parsed?.error || parsed?.message || null,
      };
    } catch (e) {
      diagnostics.tests.textSearch = { status: "ERROR", message: String(e) };
    }
  } else {
    diagnostics.tests.textSearch = { status: "SKIP", reason: "No API key" };
  }

  // Test: scraping fallback
  try {
    const scrapeResult = await scrapeAliExpressSearch("phone case");
    diagnostics.tests.scrapeFallback = {
      status: scrapeResult.products.length > 0 ? "OK" : "EMPTY",
      itemsFound: scrapeResult.products.length,
      error: scrapeResult.error || null,
    };
  } catch (e) {
    diagnostics.tests.scrapeFallback = { status: "ERROR", message: String(e) };
  }

  return NextResponse.json(diagnostics);
}

// ─── Main Handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, productTitle } = body;

    if (!imageUrl && !productTitle) {
      return NextResponse.json(
        { error: "Не передана ссылка на изображение или название товара" },
        { status: 400 }
      );
    }

    console.log("[search-china] imageUrl:", imageUrl);
    console.log("[search-china] productTitle:", productTitle);

    let allProducts: DetailedProduct[] = [];
    let searchMethod: "image" | "text" | "image+text" = "image";
    let debugInfo: Record<string, any> = {
      imageUrl,
      productTitle: productTitle || null,
      host: ALIEXPRESS_HOST,
      keySet: !!RAPIDAPI_KEY,
      keyLen: RAPIDAPI_KEY.length,
    };

    // ── Strategy 1: RapidAPI image search (if key available) ──────────
    if (RAPIDAPI_KEY && imageUrl) {
      console.log("[search-china] Trying RapidAPI image search...");
      const imageResult = await searchByImageAPI(imageUrl).catch((e) => ({
        products: [] as DetailedProduct[],
        error: String(e),
      }));

      allProducts = imageResult.products;
      debugInfo.imageSearchError = imageResult.error || null;
      debugInfo.imageSearchFound = imageResult.products.length;

      console.log(
        "[search-china] Image search results:",
        imageResult.products.length,
        imageResult.error ? `error: ${imageResult.error}` : ""
      );
    }

    // ── Strategy 2: RapidAPI text search (fallback) ──────────────────
    if (allProducts.length === 0 && RAPIDAPI_KEY && productTitle) {
      console.log("[search-china] Trying RapidAPI text search for:", productTitle);
      searchMethod = imageUrl ? "image+text" : "text";

      const textResult = await searchByTextAPI(productTitle).catch((e) => ({
        products: [] as DetailedProduct[],
        error: String(e),
      }));

      allProducts = textResult.products;
      debugInfo.textSearchError = textResult.error || null;
      debugInfo.textSearchFound = textResult.products.length;

      console.log(
        "[search-china] Text search results:",
        textResult.products.length,
        textResult.error ? `error: ${textResult.error}` : ""
      );
    }

    // ── Strategy 3: Direct HTML scraping (no API key fallback) ───────
    if (allProducts.length === 0 && productTitle) {
      console.log("[search-china] Trying HTML scraping for:", productTitle);
      searchMethod = "text";
      debugInfo.method = "scraping";

      const scrapeResult = await scrapeAliExpressSearch(productTitle).catch(
        (e) => ({
          products: [] as DetailedProduct[],
          error: String(e),
        })
      );

      allProducts = scrapeResult.products;
      debugInfo.scrapeError = scrapeResult.error || null;
      debugInfo.scrapeFound = scrapeResult.products.length;

      console.log(
        "[search-china] Scrape results:",
        scrapeResult.products.length,
        scrapeResult.error ? `error: ${scrapeResult.error}` : ""
      );
    }

    // ── Enrich top results with detailed info ────────────────────────
    if (allProducts.length > 0 && RAPIDAPI_KEY) {
      console.log("[search-china] Enriching top products with details...");
      allProducts = await enrichProducts(allProducts, 3);
    }

    // ── Return response ─────────────────────────────────────────────
    if (allProducts.length === 0) {
      return NextResponse.json({
        searchMethod,
        totalFound: 0,
        products: [],
        debug: {
          ...debugInfo,
          errorAliexpress: debugInfo.imageSearchError || debugInfo.textSearchError || debugInfo.scrapeError || "Товары не найдены",
          foundAliexpress: 0,
        },
      });
    }

    return NextResponse.json({
      searchMethod,
      totalFound: allProducts.length,
      products: allProducts,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("[search-china] Handler error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
