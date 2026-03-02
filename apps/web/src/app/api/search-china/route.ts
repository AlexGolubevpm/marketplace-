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
}

// ─── 1688 Image Search ──────────────────────────────────────────────────────

async function searchByImage(imageUrl: string): Promise<SearchResultItem[]> {
  const url = `https://${RAPIDAPI_HOST}/1688/search-image?imgUrl=${encodeURIComponent(imageUrl)}`;

  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
  });

  if (!res.ok) {
    throw new Error(`1688 image search API error: ${res.status}`);
  }

  const data = await res.json();

  if (!data.success || !data.data) {
    return [];
  }

  const items: SearchResultItem[] = (data.data || []).map((item: any) => ({
    product_id: String(item.product_id || item.offerId || ""),
    product_name: item.product_name || item.subject || "",
    price: parseFloat(item.price) || 0,
    image: item.main_img_url || item.imageUrl || "",
    month_sold: item.month_sold || null,
    repurchase_rate: item.repurchase_rate || null,
  }));

  return items;
}

// ─── 1688 Text Search ────────────────────────────────────────────────────────

async function searchByKeyword(keyword: string): Promise<SearchResultItem[]> {
  const url = `https://${RAPIDAPI_HOST}/v1/search?keyword=${encodeURIComponent(keyword)}&site=1688`;

  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
  });

  if (!res.ok) {
    throw new Error(`1688 text search API error: ${res.status}`);
  }

  const data = await res.json();

  if (!data.success || !data.data) {
    return [];
  }

  return (data.data || []).map((item: any) => ({
    product_id: String(item.product_id || ""),
    product_name: item.product_name || "",
    price: parseFloat(item.price) || 0,
    image: item.main_img_url || "",
    month_sold: item.month_sold || null,
    repurchase_rate: item.repurchase_rate || null,
  }));
}

// ─── 1688 Product Detail ────────────────────────────────────────────────────

async function getProductDetail(itemId: string): Promise<DetailedProduct | null> {
  const url = `https://${RAPIDAPI_HOST}/1688/detail?itemId=${itemId}`;

  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!data.success || !data.data) return null;

  const om = data.data.offerModel;
  if (!om) return null;

  // Extract price tiers
  const priceTiers: { price: number; min_qty: number }[] = [];
  const ranges = om.disPriceRanges || [];
  for (const r of ranges) {
    priceTiers.push({
      price: parseFloat(r.price) || 0,
      min_qty: r.beginAmount || 1,
    });
  }

  // Extract weight from freightInfo
  const freight = om.freightInfo || {};
  const unitWeightKg = freight.unitWeight || null;

  // Extract attributes
  const attributes: Record<string, string> = {};
  const featureAttrs = om.featureAttributes || [];
  for (const attr of featureAttrs) {
    if (attr.name && attr.value) {
      attributes[attr.name] = attr.value;
    }
  }

  // Prices
  const prices = priceTiers.map((t) => t.price).filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  return {
    product_id: String(om.offerId || itemId),
    title: om.subject || "",
    brand: om.brand || attributes["品牌"] || "",
    price_range: om.currentPriceDisplay || `${minPrice}-${maxPrice}`,
    min_price: minPrice,
    max_price: maxPrice,
    price_tiers: priceTiers,
    unit_weight_kg: unitWeightKg,
    images: (om.imageList || []).slice(0, 6),
    sale_quantity: om.saleQuantity || "",
    company_name: om.companyName || "",
    location: freight.location || "",
    moq: om.offerBeginAmount || 1,
    attributes,
    detail_url: om.detailUrl || `https://detail.1688.com/offer/${itemId}.html`,
  };
}

// ─── Main Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productName, imageUrl } = body;

    if (!productName && !imageUrl) {
      return NextResponse.json(
        { error: "Укажите название товара или ссылку на изображение" },
        { status: 400 }
      );
    }

    if (!RAPIDAPI_KEY) {
      return NextResponse.json(
        { error: "RAPIDAPI_KEY не настроен. Добавьте переменную окружения RAPIDAPI_KEY." },
        { status: 500 }
      );
    }

    // Strategy: try image search first, fall back to text search
    let searchResults: SearchResultItem[] = [];
    let searchMethod: "image" | "text" = "text";

    if (imageUrl) {
      try {
        searchResults = await searchByImage(imageUrl);
        if (searchResults.length > 0) {
          searchMethod = "image";
        }
      } catch {
        // Image search failed, will fall back to text
      }
    }

    // If image search returned nothing, try text search
    if (searchResults.length === 0 && productName) {
      searchResults = await searchByKeyword(productName);
      searchMethod = "text";
    }

    // Get details for top results (up to 5)
    const topResults = searchResults.slice(0, 5);
    const detailedProducts: DetailedProduct[] = [];

    const detailPromises = topResults.map(async (item) => {
      try {
        const detail = await getProductDetail(item.product_id);
        return detail;
      } catch {
        return null;
      }
    });

    const detailResults = await Promise.all(detailPromises);

    for (let i = 0; i < topResults.length; i++) {
      const detail = detailResults[i];
      if (detail) {
        detailedProducts.push(detail);
      } else {
        // Use search result data as fallback
        detailedProducts.push({
          product_id: topResults[i].product_id,
          title: topResults[i].product_name,
          brand: "",
          price_range: String(topResults[i].price),
          min_price: topResults[i].price,
          max_price: topResults[i].price,
          price_tiers: [{ price: topResults[i].price, min_qty: 1 }],
          unit_weight_kg: null,
          images: topResults[i].image ? [topResults[i].image] : [],
          sale_quantity: topResults[i].month_sold ? `${topResults[i].month_sold}+ мес.` : "",
          company_name: "",
          location: "",
          moq: 1,
          attributes: {},
          detail_url: `https://detail.1688.com/offer/${topResults[i].product_id}.html`,
        });
      }
    }

    return NextResponse.json({
      searchMethod,
      totalFound: searchResults.length,
      products: detailedProducts,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Неизвестная ошибка";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
