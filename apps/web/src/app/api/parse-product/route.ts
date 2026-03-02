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
  else basket = "21";

  return `basket-${basket}.wbbasket.ru`;
}

function getWbImageUrl(id: number, photoIndex: number = 1): string {
  const vol = Math.floor(id / 100000);
  const part = Math.floor(id / 1000);
  const host = getWbBasketHost(id);
  return `https://${host}/vol${vol}/part${part}/${id}/images/big/${photoIndex}.webp`;
}

function getWbCardInfoUrl(id: number): string {
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

async function parseWildberries(url: string): Promise<ProductData> {
  const match = url.match(/wildberries\.ru\/catalog\/(\d+)/);
  if (!match) throw new Error("Не удалось извлечь ID товара из ссылки WB");

  const productId = match[1];
  const nmId = parseInt(productId, 10);

  // Fetch main product details
  const detailUrl = `https://card.wb.ru/cards/v2/detail?appType=1&curr=rub&dest=-1257786&nm=${productId}`;
  const detailRes = await fetch(detailUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
    },
  });

  if (!detailRes.ok) {
    throw new Error(`WB API вернул ошибку: ${detailRes.status}`);
  }

  const detailData = await detailRes.json();
  const products = detailData?.data?.products;

  if (!products || products.length === 0) {
    throw new Error("Товар не найден на WB");
  }

  const product = products[0];

  // Extract price (WB returns price in kopecks * 100)
  const salePriceU = product.salePriceU || product.priceU;
  const priceU = product.priceU;
  const price = Math.round(salePriceU / 100);
  const originalPrice = Math.round(priceU / 100);
  const discount = product.sale || 0;

  // Generate image URLs
  const picCount = product.pics || 1;
  const images: string[] = [];
  for (let i = 1; i <= Math.min(picCount, 5); i++) {
    images.push(getWbImageUrl(nmId, i));
  }

  // Try to fetch card info for category and details
  let category = "";
  let subcategory = "";
  let weight: number | null = null;
  let dimensions: { length: number; width: number; height: number } | null =
    null;

  try {
    const cardInfoUrl = getWbCardInfoUrl(nmId);
    const cardInfoRes = await fetch(cardInfoUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    });

    if (cardInfoRes.ok) {
      const cardInfo = await cardInfoRes.json();
      category = cardInfo.subj_root_name || "";
      subcategory = cardInfo.subj_name || "";

      // Try to extract weight and dimensions from options
      if (cardInfo.options && Array.isArray(cardInfo.options)) {
        for (const opt of cardInfo.options) {
          const name = (opt.name || "").toLowerCase();
          const value = opt.value || "";

          if (name.includes("вес") && !name.includes("нетто")) {
            const weightMatch = value.match(/([\d.,]+)\s*(кг|г|гр)/i);
            if (weightMatch) {
              const num = parseFloat(weightMatch[1].replace(",", "."));
              const unit = weightMatch[2].toLowerCase();
              weight = unit === "кг" ? num * 1000 : num;
            }
          }

          if (
            name.includes("длина") ||
            name.includes("ширина") ||
            name.includes("высота") ||
            name.includes("габарит") ||
            name.includes("размер упаковки")
          ) {
            // Try to parse "ДxШxВ" format
            const dimMatch = value.match(
              /([\d.,]+)\s*[xхXХ×]\s*([\d.,]+)\s*[xхXХ×]\s*([\d.,]+)/
            );
            if (dimMatch) {
              dimensions = {
                length: parseFloat(dimMatch[1].replace(",", ".")),
                width: parseFloat(dimMatch[2].replace(",", ".")),
                height: parseFloat(dimMatch[3].replace(",", ".")),
              };
            }
          }
        }
      }
    }
  } catch {
    // Card info is optional, continue without it
  }

  return {
    name: product.name || "",
    brand: product.brand || "",
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
    rating: product.reviewRating || product.rating || null,
    reviewCount: product.feedbacks || null,
    quantity: product.totalQuantity || null,
  };
}

async function parseOzon(url: string): Promise<ProductData> {
  // Extract product ID from Ozon URL
  // Formats: /product/slug-123456789/ or /product/123456789/
  const match = url.match(/ozon\.ru\/product\/(?:.*?-)?(\d+)\/?/);
  if (!match) throw new Error("Не удалось извлечь ID товара из ссылки Ozon");

  const productId = match[1];

  // Try to fetch the Ozon page and extract data from meta tags / JSON-LD
  const pageRes = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
    },
    redirect: "follow",
  });

  if (!pageRes.ok) {
    throw new Error(`Ozon вернул ошибку: ${pageRes.status}`);
  }

  const html = await pageRes.text();

  // Extract data from JSON-LD (schema.org Product)
  const jsonLdMatch = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
  );

  let name = "";
  let price = 0;
  let originalPrice = 0;
  let brand = "";
  let images: string[] = [];
  let category = "";
  let rating: number | null = null;
  let reviewCount: number | null = null;

  if (jsonLdMatch) {
    for (const scriptTag of jsonLdMatch) {
      try {
        const jsonStr = scriptTag
          .replace(/<script type="application\/ld\+json">/, "")
          .replace(/<\/script>/, "");
        const jsonData = JSON.parse(jsonStr);

        if (jsonData["@type"] === "Product") {
          name = jsonData.name || "";
          brand = jsonData.brand?.name || "";
          images = jsonData.image
            ? Array.isArray(jsonData.image)
              ? jsonData.image.slice(0, 5)
              : [jsonData.image]
            : [];

          if (jsonData.offers) {
            const offers = Array.isArray(jsonData.offers)
              ? jsonData.offers[0]
              : jsonData.offers;
            price = parseFloat(offers.price) || 0;
            originalPrice = price;
          }

          if (jsonData.aggregateRating) {
            rating = parseFloat(jsonData.aggregateRating.ratingValue) || null;
            reviewCount =
              parseInt(jsonData.aggregateRating.reviewCount) || null;
          }

          if (jsonData.category) {
            category = jsonData.category;
          }
        }

        if (
          jsonData["@type"] === "BreadcrumbList" &&
          jsonData.itemListElement
        ) {
          const items = jsonData.itemListElement;
          if (items.length > 1) {
            category = items[items.length - 1]?.name || category;
          }
        }
      } catch {
        // JSON parse error, continue
      }
    }
  }

  // Fallback: try meta tags
  if (!name) {
    const ogTitle = html.match(
      /<meta\s+property="og:title"\s+content="([^"]+)"/
    );
    if (ogTitle) name = ogTitle[1];
  }

  if (images.length === 0) {
    const ogImage = html.match(
      /<meta\s+property="og:image"\s+content="([^"]+)"/
    );
    if (ogImage) images = [ogImage[1]];
  }

  if (!price) {
    // Try to find price in meta tags
    const priceMatch = html.match(
      /<meta\s+property="product:price:amount"\s+content="([^"]+)"/
    );
    if (priceMatch) {
      price = parseFloat(priceMatch[1]) || 0;
      originalPrice = price;
    }
  }

  if (!name) {
    throw new Error(
      "Не удалось получить данные товара с Ozon. Попробуйте ссылку на WB."
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
          error:
            "Поддерживаются только ссылки на Wildberries и Ozon",
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
