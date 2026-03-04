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

// ─── OTAPI BatchSearchItemsFrame (image search) ────────────────────────────

async function searchOTAPI(
  host: string,
  imageUrl: string,
  source: "1688" | "taobao"
): Promise<{ products: DetailedProduct[]; error: string }> {
  const params = new URLSearchParams({
    language: "ru",
    framePosition: "0",
    frameSize: "20",
    ImageUrl: imageUrl,
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

// ─── OTAPI BatchSearchItemsFrame (text search by keyword) ───────────────────

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

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─── Main Handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, query } = body;

    if (!imageUrl && !query) {
      return NextResponse.json(
        { error: "Не передана ссылка на изображение или поисковый запрос" },
        { status: 400 }
      );
    }

    if (!RAPIDAPI_KEY) {
      return NextResponse.json({
        searchMethod: imageUrl ? "image" : "text",
        totalFound: 0,
        products: [],
        debug: {
          imageUrl: imageUrl || null,
          query: query || null,
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

    console.log("[search-china] imageUrl:", imageUrl || "(none)");
    console.log("[search-china] query:", query || "(none)");
    console.log("[search-china] TAOBAO_HOST:", TAOBAO_HOST);
    console.log("[search-china] ALI1688_HOST:", ALI1688_HOST);
    console.log("[search-china] RAPIDAPI_KEY len:", RAPIDAPI_KEY.length);
    console.log("[search-china] PROXY:", PROXY_URL ? "configured" : "not set");

    // Determine search method: image or text
    const useImageSearch = !!imageUrl;
    const searchMethod = useImageSearch ? "image" : "text";

    const searchFn = useImageSearch
      ? (host: string, src: "1688" | "taobao") => searchOTAPI(host, imageUrl, src)
      : (host: string, src: "1688" | "taobao") => searchOTAPIByText(host, query, src);

    // Search both Taobao and 1688 in parallel
    const [taobaoResult, ali1688Result] = await Promise.all([
      searchFn(TAOBAO_HOST, "taobao").catch((e) => ({
        products: [] as DetailedProduct[],
        error: String(e),
      })),
      searchFn(ALI1688_HOST, "1688").catch((e) => ({
        products: [] as DetailedProduct[],
        error: String(e),
      })),
    ]);

    // Combine: 1688 first, then Taobao
    const allProducts = [
      ...ali1688Result.products.slice(0, 10),
      ...taobaoResult.products.slice(0, 10),
    ];

    console.log(
      `[search-china] ${searchMethod} results: 1688=`,
      ali1688Result.products.length,
      "taobao=",
      taobaoResult.products.length
    );

    if (allProducts.length === 0) {
      return NextResponse.json({
        searchMethod,
        totalFound: 0,
        products: [],
        debug: {
          imageUrl: imageUrl || null,
          query: query || null,
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
