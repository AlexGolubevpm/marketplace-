import { NextRequest, NextResponse } from "next/server";
import { ProxyAgent, fetch as undiciFetch } from "undici";

// ─── Config ─────────────────────────────────────────────────────────────────
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
// Primary: taobao-advanced (image search by photo)
const TAOBAO_ADV_HOST =
  process.env.RAPIDAPI_HOST_ADV || "taobao-advanced.p.rapidapi.com";
// Fallback text search: OTAPI hosts
const TAOBAO_HOST =
  process.env.RAPIDAPI_HOST || "taobao-tmall1.p.rapidapi.com";
const ALI1688_HOST =
  process.env.RAPIDAPI_HOST_1688 || "otapi-1688.p.rapidapi.com";
// HTTP/HTTPS proxy to bypass geo-restrictions
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
  source: "1688" | "taobao";
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

// ─── Helpers ────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─── Taobao Advanced: image search ─────────────────────────────────────────
// API: GET /api?api=item_image_search&img=<encoded_url>
// Returns array of items from Taobao/1688

function parseTaobaoAdvancedItems(data: any): DetailedProduct[] {
  // The API may return different structures — handle flexibly
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
  }

  return items.slice(0, 20).map((item: any) => {
    const price =
      parseFloat(item.price || item.priceRange?.min || item.min_price || 0) ||
      0;
    const maxPrice =
      parseFloat(item.priceRange?.max || item.max_price || item.price || 0) ||
      price;

    const images: string[] = [];
    if (item.pic_url || item.picUrl || item.image || item.img) {
      let imgUrl = item.pic_url || item.picUrl || item.image || item.img;
      if (imgUrl.startsWith("//")) imgUrl = "https:" + imgUrl;
      images.push(imgUrl);
    }
    if (item.images && Array.isArray(item.images)) {
      for (const img of item.images.slice(0, 5)) {
        const u = typeof img === "string" ? img : img.url || img.src || "";
        if (u && !images.includes(u)) {
          images.push(u.startsWith("//") ? "https:" + u : u);
        }
      }
    }

    // Detect source from URL or fields
    const itemUrl =
      item.detail_url || item.detailUrl || item.item_url || item.url || "";
    const source: "1688" | "taobao" =
      itemUrl.includes("1688.com") || item.source === "1688"
        ? "1688"
        : "taobao";

    const itemId = String(
      item.num_iid || item.nid || item.item_id || item.id || ""
    );

    return {
      product_id: itemId,
      title: item.title || item.name || "",
      brand: item.brand || item.brandName || "",
      price_range: price > 0 ? String(price) : "0",
      min_price: price,
      max_price: maxPrice,
      price_tiers: [{ price, min_qty: 1 }],
      unit_weight_kg: null,
      images: images.slice(0, 6),
      sale_quantity:
        item.sales != null
          ? String(item.sales)
          : item.sell_count != null
            ? String(item.sell_count)
            : item.volume != null
              ? String(item.volume)
              : "",
      company_name: item.nick || item.sellerNick || item.shop_name || "",
      location: item.location || item.area || item.item_loc || "",
      moq: parseInt(item.moq || "1") || 1,
      attributes: {},
      detail_url:
        itemUrl ||
        (source === "1688"
          ? `https://detail.1688.com/offer/${itemId}.html`
          : `https://item.taobao.com/item.htm?id=${itemId}`),
      source,
    };
  });
}

async function searchTaobaoAdvancedByImage(
  imageUrl: string
): Promise<{ products: DetailedProduct[]; error: string }> {
  const params = new URLSearchParams({
    api: "item_image_search",
    img: imageUrl,
  });

  const url = `https://${TAOBAO_ADV_HOST}/api?${params.toString()}`;
  console.log("[search-china] taobao-advanced image search →", url);

  const headers: Record<string, string> = {
    "x-rapidapi-key": RAPIDAPI_KEY,
    "x-rapidapi-host": TAOBAO_ADV_HOST,
  };

  const res = await proxyFetch(url, { method: "GET", headers });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      "[search-china] taobao-advanced HTTP error:",
      res.status,
      body
    );
    return { products: [], error: `HTTP ${res.status}: ${body.slice(0, 300)}` };
  }

  const data = await res.json();
  console.log(
    "[search-china] taobao-advanced raw response keys:",
    typeof data === "object" ? Object.keys(data) : typeof data
  );

  // Check for API-level errors
  if (data?.error || data?.message) {
    const errMsg = data.error || data.message;
    console.error("[search-china] taobao-advanced API error:", errMsg);
    return { products: [], error: String(errMsg) };
  }

  const products = parseTaobaoAdvancedItems(data);
  console.log(
    "[search-china] taobao-advanced parsed products:",
    products.length
  );

  return { products, error: "" };
}

// ─── OTAPI: text search (fallback) ──────────────────────────────────────────

function parseOTAPIItems(
  data: any,
  source: "1688" | "taobao"
): DetailedProduct[] {
  const items: any[] = data.Result?.Items?.Content || [];
  return items.map((item) => {
    const price = parseFloat(item.Price?.OriginalPrice) || 0;
    const promoPrice = item.PromotionPrice
      ? parseFloat(item.PromotionPrice?.OriginalPrice) || 0
      : 0;
    const effectivePrice = promoPrice > 0 ? promoPrice : price;

    const images: string[] = [];
    if (item.MainPictureUrl) images.push(item.MainPictureUrl);
    if (item.Pictures) {
      for (const pic of item.Pictures) {
        const picUrl = pic.Url || pic.Medium?.Url || pic.Large?.Url || "";
        if (picUrl && !images.includes(picUrl)) images.push(picUrl);
      }
    }

    return {
      product_id: String(item.Id || ""),
      title: item.Title || item.OriginalTitle || "",
      brand: item.BrandName || "",
      price_range: effectivePrice > 0 ? String(effectivePrice) : String(price),
      min_price: effectivePrice > 0 ? effectivePrice : price,
      max_price: price > effectivePrice ? price : effectivePrice,
      price_tiers: [
        { price: effectivePrice > 0 ? effectivePrice : price, min_qty: 1 },
      ],
      unit_weight_kg: null,
      images: images.slice(0, 6),
      sale_quantity: item.Volume != null ? String(item.Volume) : "",
      company_name: item.VendorDisplayName || item.VendorName || "",
      location: item.Location?.State || item.Location?.City || "",
      moq: 1,
      attributes: {},
      detail_url:
        item.ExternalItemUrl ||
        item.TaobaoItemUrl ||
        (source === "1688"
          ? `https://detail.1688.com/offer/${item.Id}.html`
          : `https://item.taobao.com/item.htm?id=${item.Id}`),
      source,
    };
  });
}

async function searchOTAPIByText(
  host: string,
  query: string,
  source: "1688" | "taobao"
): Promise<{ products: DetailedProduct[]; error: string }> {
  const xmlParameters = `<SearchItemsParameters><ItemTitle>${escapeXml(query)}</ItemTitle></SearchItemsParameters>`;

  const params = new URLSearchParams({
    language: "ru",
    framePosition: "0",
    frameSize: "20",
    xmlParameters,
  });

  const url = `https://${host}/BatchSearchItemsFrame?${params.toString()}`;
  console.log(`[search-china] ${source} text search →`, url);

  const headers: Record<string, string> = {
    "x-rapidapi-key": RAPIDAPI_KEY,
    "x-rapidapi-host": host,
  };

  const res = await proxyFetch(url, { method: "GET", headers });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      `[search-china] ${source} text HTTP error:`,
      res.status,
      body
    );
    return { products: [], error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
  }

  const data = await res.json();
  console.log(
    `[search-china] ${source} text response: ErrorCode=`,
    data.ErrorCode,
    "items=",
    data.Result?.Items?.Content?.length ?? 0
  );

  if (data.ErrorCode !== "Ok" || !data.Result?.Items?.Content) {
    return {
      products: [],
      error: data.ErrorCode
        ? `API ErrorCode: ${data.ErrorCode} - ${data.ErrorDescription || ""}`
        : "Empty response",
    };
  }

  return { products: parseOTAPIItems(data, source), error: "" };
}

// ─── Diagnostic GET endpoint ─────────────────────────────────────────────────

export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    config: {
      taobaoAdvancedHost: TAOBAO_ADV_HOST,
      taobaoOtapiHost: TAOBAO_HOST,
      ali1688Host: ALI1688_HOST,
      rapidApiKeySet: !!RAPIDAPI_KEY,
      rapidApiKeyLen: RAPIDAPI_KEY.length,
      proxyConfigured: !!PROXY_URL,
    },
    tests: {} as Record<string, any>,
  };

  // Test 1: Taobao Advanced API (image search) — use a known test image
  try {
    const testImg =
      "//img.alicdn.com/bao/uploaded/i4/385132127/O1CN01geAxue1RaDEwz9d3t_!!0-item_pic.jpg";
    const params = new URLSearchParams({
      api: "item_image_search",
      img: testImg,
    });
    const url = `https://${TAOBAO_ADV_HOST}/api?${params.toString()}`;
    const res = await proxyFetch(
      url,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": TAOBAO_ADV_HOST,
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
    const products = parsed ? parseTaobaoAdvancedItems(parsed) : [];
    diagnostics.tests.taobaoAdvanced = {
      status: res.ok ? "OK" : "FAIL",
      httpStatus: res.status,
      itemsFound: products.length,
      error: parsed?.error || parsed?.message || null,
      sampleResponse: body.slice(0, 500),
    };
  } catch (e) {
    diagnostics.tests.taobaoAdvanced = { status: "ERROR", message: String(e) };
  }

  // Test 2: OTAPI Taobao text search
  try {
    const testXml = `<SearchItemsParameters><ItemTitle>test</ItemTitle></SearchItemsParameters>`;
    const params = new URLSearchParams({
      language: "en",
      framePosition: "0",
      frameSize: "1",
      xmlParameters: testXml,
    });
    const url = `https://${TAOBAO_HOST}/BatchSearchItemsFrame?${params.toString()}`;
    const res = await proxyFetch(
      url,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": TAOBAO_HOST,
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
    diagnostics.tests.taobaoOtapi = {
      status: res.ok ? "OK" : "FAIL",
      httpStatus: res.status,
      errorCode: parsed?.ErrorCode || null,
      itemsFound: parsed?.Result?.Items?.Content?.length ?? 0,
    };
  } catch (e) {
    diagnostics.tests.taobaoOtapi = { status: "ERROR", message: String(e) };
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
          host: TAOBAO_ADV_HOST,
          keySet: false,
          keyLen: 0,
          errorTaobao: "RAPIDAPI_KEY не настроен",
          error1688: "RAPIDAPI_KEY не настроен",
          found1688: 0,
          foundTaobao: 0,
        },
      });
    }

    console.log("[search-china] imageUrl:", imageUrl);
    console.log("[search-china] productTitle:", productTitle);
    console.log("[search-china] TAOBAO_ADV_HOST:", TAOBAO_ADV_HOST);
    console.log("[search-china] RAPIDAPI_KEY len:", RAPIDAPI_KEY.length);
    console.log("[search-china] PROXY:", PROXY_URL ? "configured" : "not set");

    // ── Step 1: Image search via taobao-advanced ────────────────────────
    let imageResult: { products: DetailedProduct[]; error: string } = {
      products: [],
      error: "",
    };
    let searchMethod: "image" | "text" | "image+text" = "image";

    if (imageUrl) {
      imageResult = await searchTaobaoAdvancedByImage(imageUrl).catch((e) => ({
        products: [] as DetailedProduct[],
        error: String(e),
      }));

      console.log(
        "[search-china] image search results:",
        imageResult.products.length,
        imageResult.error ? `error: ${imageResult.error}` : ""
      );
    }

    // ── Step 2: Text search fallback via OTAPI if image failed ──────────
    let textTaobaoResult: { products: DetailedProduct[]; error: string } = {
      products: [],
      error: "",
    };
    let textAli1688Result: { products: DetailedProduct[]; error: string } = {
      products: [],
      error: "",
    };

    if (imageResult.products.length === 0 && productTitle) {
      console.log(
        "[search-china] Image search returned 0 results, trying text search:",
        productTitle
      );
      searchMethod = imageUrl ? "image+text" : "text";

      [textTaobaoResult, textAli1688Result] = await Promise.all([
        searchOTAPIByText(TAOBAO_HOST, productTitle, "taobao").catch((e) => ({
          products: [] as DetailedProduct[],
          error: String(e),
        })),
        searchOTAPIByText(ALI1688_HOST, productTitle, "1688").catch((e) => ({
          products: [] as DetailedProduct[],
          error: String(e),
        })),
      ]);

      console.log(
        "[search-china] text fallback: taobao=",
        textTaobaoResult.products.length,
        "1688=",
        textAli1688Result.products.length
      );
    }

    // ── Combine results ─────────────────────────────────────────────────
    const allProducts = [
      ...imageResult.products.slice(0, 15),
      ...textAli1688Result.products.slice(0, 10),
      ...textTaobaoResult.products.slice(0, 10),
    ];

    if (allProducts.length === 0) {
      return NextResponse.json({
        searchMethod,
        totalFound: 0,
        products: [],
        debug: {
          imageUrl,
          productTitle: productTitle || null,
          host: `${TAOBAO_ADV_HOST} (image) / ${TAOBAO_HOST} + ${ALI1688_HOST} (text)`,
          keySet: !!RAPIDAPI_KEY,
          keyLen: RAPIDAPI_KEY.length,
          proxy: PROXY_URL
            ? "configured"
            : "not set (нужен прокси для РФ серверов)",
          errorTaobao:
            imageResult.error || textTaobaoResult.error || null,
          error1688: textAli1688Result.error || null,
          foundTaobao:
            imageResult.products.length + textTaobaoResult.products.length,
          found1688: textAli1688Result.products.length,
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
