import { NextRequest, NextResponse } from "next/server";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "taobao-1688-api1.p.rapidapi.com";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SearchResultItem {
  product_id: string;
  product_name: string;
  price: number;
  image: string;
  month_sold: number | null;
  repurchase_rate: string | null;
  source: "1688" | "taobao";
}

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

function fetchWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

const rapidHeaders = {
  "x-rapidapi-key": RAPIDAPI_KEY,
  "x-rapidapi-host": RAPIDAPI_HOST,
};

// ─── Image Search (1688 + Taobao) ───────────────────────────────────────────

async function searchByImage1688(imageUrl: string): Promise<SearchResultItem[]> {
  const url = `https://${RAPIDAPI_HOST}/1688/search-image?imgUrl=${encodeURIComponent(imageUrl)}`;
  console.log("[search-china] 1688 search →", url);
  const res = await fetchWithTimeout(url, { headers: rapidHeaders });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[search-china] 1688 error:", res.status, body);
    throw new Error(`1688: ${res.status}`);
  }
  const data = await res.json();
  console.log("[search-china] 1688 response: success=", data.success, "items=", data.data?.length ?? 0);
  if (!data.success || !data.data) return [];

  return (data.data || []).map((item: any) => ({
    product_id: String(item.product_id || item.offerId || ""),
    product_name: item.product_name || item.subject || "",
    price: parseFloat(item.price) || 0,
    image: item.main_img_url || item.imageUrl || "",
    month_sold: item.month_sold || null,
    repurchase_rate: item.repurchase_rate || null,
    source: "1688" as const,
  }));
}

async function searchByImageTaobao(imageUrl: string): Promise<SearchResultItem[]> {
  const url = `https://${RAPIDAPI_HOST}/taobao/search-image?imgUrl=${encodeURIComponent(imageUrl)}`;
  console.log("[search-china] taobao search →", url);
  const res = await fetchWithTimeout(url, { headers: rapidHeaders });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[search-china] taobao error:", res.status, body);
    throw new Error(`taobao: ${res.status}`);
  }
  const data = await res.json();
  console.log("[search-china] taobao response: success=", data.success, "items=", data.data?.length ?? 0);
  if (!data.success || !data.data) return [];

  return (data.data || []).map((item: any) => ({
    product_id: String(item.product_id || item.num_iid || item.nid || ""),
    product_name: item.product_name || item.title || "",
    price: parseFloat(item.price) || 0,
    image: item.main_img_url || item.pic_url || item.imageUrl || "",
    month_sold: item.month_sold || item.sold || null,
    repurchase_rate: item.repurchase_rate || null,
    source: "taobao" as const,
  }));
}

// ─── Product Detail ─────────────────────────────────────────────────────────

async function get1688Detail(itemId: string): Promise<DetailedProduct | null> {
  const url = `https://${RAPIDAPI_HOST}/1688/detail?itemId=${itemId}`;
  const res = await fetchWithTimeout(url, { headers: rapidHeaders });
  if (!res.ok) return null;

  const data = await res.json();
  if (!data.success || !data.data) return null;

  const om = data.data.offerModel;
  if (!om) return null;

  const priceTiers: { price: number; min_qty: number }[] = [];
  for (const r of om.disPriceRanges || []) {
    priceTiers.push({ price: parseFloat(r.price) || 0, min_qty: r.beginAmount || 1 });
  }

  const freight = om.freightInfo || {};
  const attributes: Record<string, string> = {};
  for (const attr of om.featureAttributes || []) {
    if (attr.name && attr.value) attributes[attr.name] = attr.value;
  }

  const prices = priceTiers.map((t) => t.price).filter((p) => p > 0);

  return {
    product_id: String(om.offerId || itemId),
    title: om.subject || "",
    brand: om.brand || attributes["品牌"] || "",
    price_range: om.currentPriceDisplay || (prices.length ? `${Math.min(...prices)}-${Math.max(...prices)}` : "0"),
    min_price: prices.length ? Math.min(...prices) : 0,
    max_price: prices.length ? Math.max(...prices) : 0,
    price_tiers: priceTiers,
    unit_weight_kg: freight.unitWeight || null,
    images: (om.imageList || []).slice(0, 6),
    sale_quantity: om.saleQuantity || "",
    company_name: om.companyName || "",
    location: freight.location || "",
    moq: om.offerBeginAmount || 1,
    attributes,
    detail_url: om.detailUrl || `https://detail.1688.com/offer/${itemId}.html`,
    source: "1688",
  };
}

async function getTaobaoDetail(itemId: string): Promise<DetailedProduct | null> {
  const url = `https://${RAPIDAPI_HOST}/item/v2/taobao?itemId=${itemId}`;
  const res = await fetchWithTimeout(url, { headers: rapidHeaders });
  if (!res.ok) return null;

  const data = await res.json();
  if (!data.success || !data.data) return null;

  const item = data.data;
  const priceNum = parseFloat(item.price) || 0;

  return {
    product_id: String(item.num_iid || item.item_id || itemId),
    title: item.title || "",
    brand: item.brand || "",
    price_range: item.price || String(priceNum),
    min_price: priceNum,
    max_price: parseFloat(item.original_price || item.price) || priceNum,
    price_tiers: [{ price: priceNum, min_qty: 1 }],
    unit_weight_kg: null,
    images: (item.images || item.item_imgs || []).slice(0, 6),
    sale_quantity: item.sold_count || item.sales || "",
    company_name: item.shop_name || item.seller_nick || "",
    location: item.location || "",
    moq: 1,
    attributes: {},
    detail_url: item.detail_url || `https://item.taobao.com/item.htm?id=${itemId}`,
    source: "taobao",
  };
}

// ─── Main Handler ────────────────────────────────────────────────────────────

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
      return NextResponse.json(
        { error: "RAPIDAPI_KEY не настроен. Добавьте переменную окружения RAPIDAPI_KEY." },
        { status: 500 }
      );
    }

    console.log("[search-china] imageUrl:", imageUrl);

    // Search both 1688 and Taobao by image in parallel
    const [results1688, resultsTaobao] = await Promise.all([
      searchByImage1688(imageUrl).catch((e) => { console.error("[search-china] 1688 catch:", e); return [] as SearchResultItem[]; }),
      searchByImageTaobao(imageUrl).catch((e) => { console.error("[search-china] taobao catch:", e); return [] as SearchResultItem[]; }),
    ]);

    console.log("[search-china] results: 1688=", results1688.length, "taobao=", resultsTaobao.length);

    // Combine: 1688 first, then Taobao
    const allResults = [...results1688, ...resultsTaobao];

    if (allResults.length === 0) {
      return NextResponse.json({
        searchMethod: "image",
        totalFound: 0,
        products: [],
      });
    }

    // Get details for top results (up to 5 from each source)
    const top1688 = results1688.slice(0, 5);
    const topTaobao = resultsTaobao.slice(0, 5);
    const topResults = [...top1688, ...topTaobao];

    const detailPromises = topResults.map(async (item) => {
      try {
        if (item.source === "1688") {
          return await get1688Detail(item.product_id);
        } else {
          return await getTaobaoDetail(item.product_id);
        }
      } catch {
        return null;
      }
    });

    const detailResults = await Promise.all(detailPromises);

    const detailedProducts: DetailedProduct[] = [];
    for (let i = 0; i < topResults.length; i++) {
      const detail = detailResults[i];
      if (detail) {
        detailedProducts.push(detail);
      } else {
        const item = topResults[i];
        const isT = item.source === "taobao";
        detailedProducts.push({
          product_id: item.product_id,
          title: item.product_name,
          brand: "",
          price_range: String(item.price),
          min_price: item.price,
          max_price: item.price,
          price_tiers: [{ price: item.price, min_qty: 1 }],
          unit_weight_kg: null,
          images: item.image ? [item.image] : [],
          sale_quantity: item.month_sold ? `${item.month_sold}+` : "",
          company_name: "",
          location: "",
          moq: 1,
          attributes: {},
          detail_url: isT
            ? `https://item.taobao.com/item.htm?id=${item.product_id}`
            : `https://detail.1688.com/offer/${item.product_id}.html`,
          source: item.source,
        });
      }
    }

    return NextResponse.json({
      searchMethod: "image",
      totalFound: allResults.length,
      products: detailedProducts,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Неизвестная ошибка";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
