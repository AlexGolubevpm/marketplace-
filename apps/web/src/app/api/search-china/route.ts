import { NextRequest, NextResponse } from "next/server";

// ─── Config ─────────────────────────────────────────────────────────────────
// OTAPI via RapidAPI: taobao-tmall1 for Taobao, otapi-1688 for 1688
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const TAOBAO_HOST = process.env.RAPIDAPI_HOST || "taobao-tmall1.p.rapidapi.com";
const ALI1688_HOST = process.env.RAPIDAPI_HOST_1688 || "otapi-1688.p.rapidapi.com";

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

// ─── OTAPI BatchSearchItemsFrame ────────────────────────────────────────────

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
  console.log(`[search-china] ${source} search →`, url);

  const headers = {
    "x-rapidapi-key": RAPIDAPI_KEY,
    "x-rapidapi-host": host,
  };

  const res = await fetchWithTimeout(url, { method: "GET", headers });

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

  const items: any[] = data.Result.Items.Content;
  const products: DetailedProduct[] = items.map((item) => {
    const price = parseFloat(item.Price?.OriginalPrice) || 0;
    const promoPrice = item.PromotionPrice
      ? parseFloat(item.PromotionPrice?.OriginalPrice) || 0
      : 0;
    const effectivePrice = promoPrice > 0 ? promoPrice : price;

    // Collect images
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

  return { products, error: "" };
}

// ─── Main Handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Не передана ссылка на изображение товара" },
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
    console.log("[search-china] TAOBAO_HOST:", TAOBAO_HOST);
    console.log("[search-china] ALI1688_HOST:", ALI1688_HOST);
    console.log("[search-china] RAPIDAPI_KEY len:", RAPIDAPI_KEY.length);

    // Search both Taobao and 1688 in parallel
    const [taobaoResult, ali1688Result] = await Promise.all([
      searchOTAPI(TAOBAO_HOST, imageUrl, "taobao").catch((e) => ({
        products: [] as DetailedProduct[],
        error: String(e),
      })),
      searchOTAPI(ALI1688_HOST, imageUrl, "1688").catch((e) => ({
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
      "[search-china] results: 1688=",
      ali1688Result.products.length,
      "taobao=",
      taobaoResult.products.length
    );

    if (allProducts.length === 0) {
      return NextResponse.json({
        searchMethod: "image",
        totalFound: 0,
        products: [],
        debug: {
          imageUrl,
          host: `${TAOBAO_HOST} / ${ALI1688_HOST}`,
          keySet: !!RAPIDAPI_KEY,
          keyLen: RAPIDAPI_KEY.length,
          errorTaobao: taobaoResult.error || null,
          error1688: ali1688Result.error || null,
          foundTaobao: taobaoResult.products.length,
          found1688: ali1688Result.products.length,
        },
      });
    }

    return NextResponse.json({
      searchMethod: "image",
      totalFound: allProducts.length,
      products: allProducts,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Неизвестная ошибка";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
