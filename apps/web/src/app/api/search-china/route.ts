import { NextRequest, NextResponse } from "next/server";
import { ProxyAgent, fetch as undiciFetch } from "undici";

// ─── Config ─────────────────────────────────────────────────────────────────
// OTAPI via RapidAPI: taobao-tmall1 for Taobao, otapi-1688 for 1688
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const TAOBAO_HOST = process.env.RAPIDAPI_HOST || "taobao-tmall1.p.rapidapi.com";
const ALI1688_HOST = process.env.RAPIDAPI_HOST_1688 || "otapi-1688.p.rapidapi.com";
// HTTP/HTTPS proxy to bypass geo-restrictions (e.g. "http://user:pass@proxy:8080")
const PROXY_URL = process.env.RAPIDAPI_PROXY || "";

// Create a reusable proxy agent if configured
const proxyAgent = PROXY_URL ? new ProxyAgent(PROXY_URL) : null;

if (proxyAgent) {
  const masked = PROXY_URL.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
  console.log("[search-china] Proxy agent created:", masked);
} else {
  console.log("[search-china] No proxy configured (RAPIDAPI_PROXY is empty)");
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
): Promise<{ ok: boolean; status: number; text: () => Promise<string>; json: () => Promise<any> }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (proxyAgent) {
      console.log("[search-china] Fetching via proxy...");
      const res = await undiciFetch(url, {
        ...opts,
        signal: controller.signal,
        dispatcher: proxyAgent,
      });
      return res as any;
    }
    console.log("[search-china] Fetching directly (no proxy)...");
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── Parse OTAPI response into DetailedProduct[] ────────────────────────────

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
      price_tiers: [{ price: effectivePrice > 0 ? effectivePrice : price, min_qty: 1 }],
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

// ─── Helpers ────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─── OTAPI BatchSearchItemsFrame (image search) ────────────────────────────

async function searchOTAPI(
  host: string,
  imageUrl: string,
  source: "1688" | "taobao"
): Promise<{ products: DetailedProduct[]; error: string }> {
  // ImageUrl must be inside xmlParameters for Taobao (and works for 1688 too)
  const xmlParameters = `<SearchItemsParameters><ImageUrl>${escapeXml(imageUrl)}</ImageUrl></SearchItemsParameters>`;

  const params = new URLSearchParams({
    language: "ru",
    framePosition: "0",
    frameSize: "20",
    xmlParameters,
  });

  const url = `https://${host}/BatchSearchItemsFrame?${params.toString()}`;
  console.log(`[search-china] ${source} image search →`, url);

  const headers: Record<string, string> = {
    "x-rapidapi-key": RAPIDAPI_KEY,
    "x-rapidapi-host": host,
  };

  const res = await proxyFetch(url, { method: "GET", headers });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[search-china] ${source} HTTP error:`, res.status, body);
    return { products: [], error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
  }

  const data = await res.json();
  console.log(
    `[search-china] ${source} response: ErrorCode=`,
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

// ─── OTAPI text search (by ItemTitle) ────────────────────────────────────────

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
    console.error(`[search-china] ${source} text HTTP error:`, res.status, body);
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

// ─── Check if image URL is accessible ────────────────────────────────────────

async function isImageAccessible(imageUrl: string): Promise<boolean> {
  try {
    const res = await proxyFetch(imageUrl, { method: "HEAD" }, 5000);
    const ok = res.ok;
    console.log(`[search-china] Image accessibility check: ${ok ? "OK" : res.status} → ${imageUrl}`);
    return ok;
  } catch (e) {
    console.log(`[search-china] Image not accessible: ${e} → ${imageUrl}`);
    return false;
  }
}

// ─── Diagnostic GET endpoint ─────────────────────────────────────────────────

export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    config: {
      taobaoHost: TAOBAO_HOST,
      ali1688Host: ALI1688_HOST,
      rapidApiKeySet: !!RAPIDAPI_KEY,
      rapidApiKeyLen: RAPIDAPI_KEY.length,
      proxyConfigured: !!PROXY_URL,
    },
    tests: {} as Record<string, any>,
  };

  // Test 1: Taobao API connectivity (simple text search)
  try {
    const testXml = `<SearchItemsParameters><ItemTitle>test</ItemTitle></SearchItemsParameters>`;
    const params = new URLSearchParams({
      language: "en",
      framePosition: "0",
      frameSize: "1",
      xmlParameters: testXml,
    });
    const url = `https://${TAOBAO_HOST}/BatchSearchItemsFrame?${params.toString()}`;
    const res = await proxyFetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": TAOBAO_HOST,
      },
    }, 15000);
    const body = await res.text().catch(() => "");
    let parsed: any = null;
    try { parsed = JSON.parse(body); } catch { /* not json */ }
    diagnostics.tests.taobao = {
      status: res.ok ? "OK" : "FAIL",
      httpStatus: res.status,
      errorCode: parsed?.ErrorCode || null,
      itemsFound: parsed?.Result?.Items?.Content?.length ?? 0,
    };
  } catch (e) {
    diagnostics.tests.taobao = { status: "ERROR", message: String(e) };
  }

  // Test 2: 1688 API connectivity
  try {
    const testXml = `<SearchItemsParameters><ItemTitle>test</ItemTitle></SearchItemsParameters>`;
    const params = new URLSearchParams({
      language: "en",
      framePosition: "0",
      frameSize: "1",
      xmlParameters: testXml,
    });
    const url = `https://${ALI1688_HOST}/BatchSearchItemsFrame?${params.toString()}`;
    const res = await proxyFetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": ALI1688_HOST,
      },
    }, 15000);
    const body = await res.text().catch(() => "");
    let parsed: any = null;
    try { parsed = JSON.parse(body); } catch { /* not json */ }
    diagnostics.tests.ali1688 = {
      status: res.ok ? "OK" : "FAIL",
      httpStatus: res.status,
      errorCode: parsed?.ErrorCode || null,
      itemsFound: parsed?.Result?.Items?.Content?.length ?? 0,
    };
  } catch (e) {
    diagnostics.tests.ali1688 = { status: "ERROR", message: String(e) };
  }

  // Test 3: WB image accessibility
  try {
    const testImageUrl = "https://basket-01.wbbasket.ru/vol1/part1/1/images/big/1.jpg";
    const accessible = await isImageAccessible(testImageUrl);
    diagnostics.tests.wbImageAccess = {
      status: accessible ? "ACCESSIBLE" : "BLOCKED",
      testUrl: testImageUrl,
      note: accessible
        ? "WB CDN images are accessible from this server"
        : "WB CDN blocks external access — image search will use text fallback",
    };
  } catch (e) {
    diagnostics.tests.wbImageAccess = { status: "ERROR", message: String(e) };
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
          host: TAOBAO_HOST,
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
    console.log("[search-china] TAOBAO_HOST:", TAOBAO_HOST);
    console.log("[search-china] ALI1688_HOST:", ALI1688_HOST);
    console.log("[search-china] RAPIDAPI_KEY len:", RAPIDAPI_KEY.length);
    console.log("[search-china] PROXY:", PROXY_URL ? "configured" : "not set");

    // Step 1: Try image search on both platforms
    let taobaoResult: { products: DetailedProduct[]; error: string } = { products: [], error: "" };
    let ali1688Result: { products: DetailedProduct[]; error: string } = { products: [], error: "" };
    let searchMethod: "image" | "text" | "image+text" = "image";

    if (imageUrl) {
      [taobaoResult, ali1688Result] = await Promise.all([
        searchOTAPI(TAOBAO_HOST, imageUrl, "taobao").catch((e) => ({
          products: [] as DetailedProduct[],
          error: String(e),
        })),
        searchOTAPI(ALI1688_HOST, imageUrl, "1688").catch((e) => ({
          products: [] as DetailedProduct[],
          error: String(e),
        })),
      ]);

      console.log(
        "[search-china] image results: 1688=",
        ali1688Result.products.length,
        "taobao=",
        taobaoResult.products.length
      );
    }

    // Step 2: Fallback to text search if image search failed and productTitle is provided
    const imageSearchFailed =
      taobaoResult.products.length === 0 && ali1688Result.products.length === 0;

    if (imageSearchFailed && productTitle) {
      console.log("[search-china] Image search returned 0 results, trying text search with:", productTitle);
      searchMethod = imageUrl ? "image+text" : "text";

      const [taobaoText, ali1688Text] = await Promise.all([
        searchOTAPIByText(TAOBAO_HOST, productTitle, "taobao").catch((e) => ({
          products: [] as DetailedProduct[],
          error: String(e),
        })),
        searchOTAPIByText(ALI1688_HOST, productTitle, "1688").catch((e) => ({
          products: [] as DetailedProduct[],
          error: String(e),
        })),
      ]);

      // Use text results as fallback
      if (taobaoText.products.length > 0) {
        taobaoResult = taobaoText;
      } else if (taobaoText.error && !taobaoResult.error) {
        taobaoResult.error = `Text fallback: ${taobaoText.error}`;
      }

      if (ali1688Text.products.length > 0) {
        ali1688Result = ali1688Text;
      } else if (ali1688Text.error && !ali1688Result.error) {
        ali1688Result.error = `Text fallback: ${ali1688Text.error}`;
      }

      console.log(
        "[search-china] text fallback results: 1688=",
        ali1688Result.products.length,
        "taobao=",
        taobaoResult.products.length
      );
    }

    // Combine: 1688 first, then Taobao
    const allProducts = [
      ...ali1688Result.products.slice(0, 10),
      ...taobaoResult.products.slice(0, 10),
    ];

    if (allProducts.length === 0) {
      return NextResponse.json({
        searchMethod,
        totalFound: 0,
        products: [],
        debug: {
          imageUrl,
          productTitle: productTitle || null,
          host: `${TAOBAO_HOST} / ${ALI1688_HOST}`,
          keySet: !!RAPIDAPI_KEY,
          keyLen: RAPIDAPI_KEY.length,
          proxy: PROXY_URL ? "configured" : "not set (нужен прокси для РФ серверов)",
          errorTaobao: taobaoResult.error || null,
          error1688: ali1688Result.error || null,
          foundTaobao: taobaoResult.products.length,
          found1688: ali1688Result.products.length,
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
