import { NextRequest, NextResponse } from "next/server";
import { ProxyAgent, fetch as undiciFetch } from "undici";

// ─── Config ─────────────────────────────────────────────────────────────────
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const ALIEXPRESS_HOST =
  process.env.RAPIDAPI_HOST_ALIEXPRESS || "aliexpress-datahub.p.rapidapi.com";
const PROXY_URL = process.env.RAPIDAPI_PROXY || "";

const proxyAgent = PROXY_URL ? new ProxyAgent(PROXY_URL) : null;

if (proxyAgent) {
  const masked = PROXY_URL.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
  console.log("[search-china] Proxy agent created:", masked);
} else {
  console.log("[search-china] No proxy configured");
}

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

// ─── Fetch with proxy + timeout ─────────────────────────────────────────────

async function proxyFetch(
  url: string,
  opts: Record<string, any> = {},
  timeoutMs = 20000
): Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
  json: () => Promise<any>;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (proxyAgent) {
      const res = await undiciFetch(url, {
        ...opts,
        signal: controller.signal,
        dispatcher: proxyAgent,
      });
      return res as any;
    }
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── Parse AliExpress DataHub items ─────────────────────────────────────────

function parseAliExpressItems(data: any): DetailedProduct[] {
  // DataHub may return different structures — handle flexibly
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
    // Price parsing — handle various formats
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

    // Images
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

async function searchByImage(
  imageUrl: string
): Promise<{ products: DetailedProduct[]; error: string; rawResponse?: any }> {
  const params = new URLSearchParams({ image_url: imageUrl });
  const url = `https://${ALIEXPRESS_HOST}/image_search?${params.toString()}`;
  console.log("[search-china] AliExpress image search →", url);

  const headers: Record<string, string> = {
    "x-rapidapi-key": RAPIDAPI_KEY,
    "x-rapidapi-host": ALIEXPRESS_HOST,
  };

  const res = await proxyFetch(url, { method: "GET", headers });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[search-china] AliExpress image HTTP error:", res.status, body);
    return {
      products: [],
      error: `HTTP ${res.status}: ${body.slice(0, 300)}`,
    };
  }

  const data = await res.json();
  console.log(
    "[search-china] AliExpress image response keys:",
    typeof data === "object" && data ? Object.keys(data) : typeof data
  );

  if (data?.error || data?.message) {
    const errMsg = data.error || data.message;
    console.error("[search-china] AliExpress API error:", errMsg);
    return { products: [], error: String(errMsg), rawResponse: data };
  }

  const products = parseAliExpressItems(data);
  console.log("[search-china] AliExpress image parsed:", products.length);

  return { products, error: "", rawResponse: data };
}

// ─── AliExpress DataHub: text search (fallback) ─────────────────────────────

async function searchByText(
  query: string
): Promise<{ products: DetailedProduct[]; error: string }> {
  const params = new URLSearchParams({
    q: query,
    page: "1",
    sort: "default",
  });
  const url = `https://${ALIEXPRESS_HOST}/item_search_2?${params.toString()}`;
  console.log("[search-china] AliExpress text search →", url);

  const headers: Record<string, string> = {
    "x-rapidapi-key": RAPIDAPI_KEY,
    "x-rapidapi-host": ALIEXPRESS_HOST,
  };

  const res = await proxyFetch(url, { method: "GET", headers });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[search-china] AliExpress text HTTP error:", res.status, body);
    return {
      products: [],
      error: `HTTP ${res.status}: ${body.slice(0, 300)}`,
    };
  }

  const data = await res.json();

  if (data?.error || (data?.message && !data?.result)) {
    return { products: [], error: String(data.error || data.message) };
  }

  const products = parseAliExpressItems(data);
  console.log("[search-china] AliExpress text parsed:", products.length);

  return { products, error: "" };
}

// ─── Diagnostic GET endpoint ─────────────────────────────────────────────────

export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    config: {
      aliexpressHost: ALIEXPRESS_HOST,
      rapidApiKeySet: !!RAPIDAPI_KEY,
      rapidApiKeyLen: RAPIDAPI_KEY.length,
      proxyConfigured: !!PROXY_URL,
    },
    tests: {} as Record<string, any>,
  };

  // Test 1: AliExpress text search
  try {
    const params = new URLSearchParams({
      q: "test",
      page: "1",
      sort: "default",
    });
    const url = `https://${ALIEXPRESS_HOST}/item_search_2?${params.toString()}`;
    const res = await proxyFetch(
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

  // Test 2: AliExpress image search (with test image)
  try {
    const testImg =
      "https://ae01.alicdn.com/kf/S5c5f0a2b4c5b4b2e8f5d0c9f0e0e2c0cF.jpg";
    const params = new URLSearchParams({ image_url: testImg });
    const url = `https://${ALIEXPRESS_HOST}/image_search?${params.toString()}`;
    const res = await proxyFetch(
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
    diagnostics.tests.imageSearch = {
      status: res.ok ? "OK" : "FAIL",
      httpStatus: res.status,
      itemsFound: products.length,
      error: parsed?.error || parsed?.message || null,
      sampleResponse: body.slice(0, 500),
    };
  } catch (e) {
    diagnostics.tests.imageSearch = { status: "ERROR", message: String(e) };
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

    if (!RAPIDAPI_KEY) {
      return NextResponse.json({
        searchMethod: "image",
        totalFound: 0,
        products: [],
        debug: {
          imageUrl,
          productTitle,
          host: ALIEXPRESS_HOST,
          keySet: false,
          keyLen: 0,
          errorAliexpress: "RAPIDAPI_KEY не настроен",
          foundAliexpress: 0,
        },
      });
    }

    console.log("[search-china] imageUrl:", imageUrl);
    console.log("[search-china] productTitle:", productTitle);
    console.log("[search-china] ALIEXPRESS_HOST:", ALIEXPRESS_HOST);
    console.log("[search-china] RAPIDAPI_KEY len:", RAPIDAPI_KEY.length);

    // ── Step 1: Image search ────────────────────────────────────────────
    let imageResult: { products: DetailedProduct[]; error: string } = {
      products: [],
      error: "",
    };
    let searchMethod: "image" | "text" | "image+text" = "image";

    if (imageUrl) {
      imageResult = await searchByImage(imageUrl).catch((e) => ({
        products: [] as DetailedProduct[],
        error: String(e),
      }));

      console.log(
        "[search-china] image search results:",
        imageResult.products.length,
        imageResult.error ? `error: ${imageResult.error}` : ""
      );
    }

    // ── Step 2: Text search fallback if image failed ────────────────────
    let textResult: { products: DetailedProduct[]; error: string } = {
      products: [],
      error: "",
    };

    if (imageResult.products.length === 0 && productTitle) {
      console.log(
        "[search-china] Image search returned 0, trying text:",
        productTitle
      );
      searchMethod = imageUrl ? "image+text" : "text";

      textResult = await searchByText(productTitle).catch((e) => ({
        products: [] as DetailedProduct[],
        error: String(e),
      }));

      console.log(
        "[search-china] text fallback results:",
        textResult.products.length
      );
    }

    // ── Combine results ─────────────────────────────────────────────────
    const allProducts = [
      ...imageResult.products.slice(0, 15),
      ...textResult.products.slice(0, 15),
    ];

    if (allProducts.length === 0) {
      return NextResponse.json({
        searchMethod,
        totalFound: 0,
        products: [],
        debug: {
          imageUrl,
          productTitle: productTitle || null,
          host: ALIEXPRESS_HOST,
          keySet: !!RAPIDAPI_KEY,
          keyLen: RAPIDAPI_KEY.length,
          proxy: PROXY_URL
            ? "configured"
            : "not set",
          errorAliexpress: imageResult.error || textResult.error || null,
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
