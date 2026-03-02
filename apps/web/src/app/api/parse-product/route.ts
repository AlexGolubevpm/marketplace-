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

function fetchWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function parseWildberries(url: string): Promise<ProductData> {
  const match = url.match(/wildberries\.ru\/catalog\/(\d+)/);
  if (!match) throw new Error("Не удалось извлечь ID товара из ссылки WB");

  const productId = match[1];
  const nmId = parseInt(productId, 10);

  // Fetch main product details
  const detailUrl = `https://card.wb.ru/cards/v2/detail?appType=1&curr=rub&dest=-1257786&nm=${productId}`;
  let detailRes: Response;
  try {
    detailRes = await fetchWithTimeout(detailUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Таймаут при обращении к WB API. Попробуйте ещё раз.");
    }
    throw new Error(`Не удалось подключиться к WB API: ${err instanceof Error ? err.message : "сеть недоступна"}`);
  }

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
    const cardInfoRes = await fetchWithTimeout(cardInfoUrl, {
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

      // Extract weight and dimensions from options
      if (cardInfo.options && Array.isArray(cardInfo.options)) {
        let dimL: number | null = null;
        let dimW: number | null = null;
        let dimH: number | null = null;

        for (const opt of cardInfo.options) {
          const name = (opt.name || "").toLowerCase();
          const value = opt.value || "";

          // Weight: "Вес товара", "Вес с упаковкой", "Вес, г" etc.
          if (
            (name.includes("вес") || name === "weight") &&
            !weight
          ) {
            // Try "123 г", "1.5 кг", "0,3 кг", or just a number (grams)
            const weightMatch = value.match(/([\d.,]+)\s*(кг|г|гр|kg|g)?/i);
            if (weightMatch) {
              const num = parseFloat(weightMatch[1].replace(",", "."));
              const unit = (weightMatch[2] || "г").toLowerCase();
              if (unit === "кг" || unit === "kg") {
                weight = num * 1000;
              } else {
                weight = num;
              }
            }
          }

          // Dimensions: "ДxШxВ" in a single field
          if (
            name.includes("габарит") ||
            name.includes("размер упаковки") ||
            name.includes("размеры")
          ) {
            const dimMatch = value.match(
              /([\d.,]+)\s*[xхXХ×*]\s*([\d.,]+)\s*[xхXХ×*]\s*([\d.,]+)/
            );
            if (dimMatch) {
              dimensions = {
                length: parseFloat(dimMatch[1].replace(",", ".")),
                width: parseFloat(dimMatch[2].replace(",", ".")),
                height: parseFloat(dimMatch[3].replace(",", ".")),
              };
            }
          }

          // Individual dimension fields
          if (name.includes("длина") && !name.includes("рукав")) {
            const m = value.match(/([\d.,]+)/);
            if (m) dimL = parseFloat(m[1].replace(",", "."));
          }
          if (name.includes("ширина")) {
            const m = value.match(/([\d.,]+)/);
            if (m) dimW = parseFloat(m[1].replace(",", "."));
          }
          if (name.includes("высота") || name.includes("глубина")) {
            const m = value.match(/([\d.,]+)/);
            if (m) dimH = parseFloat(m[1].replace(",", "."));
          }
        }

        // Assemble dimensions from individual fields if not already found
        if (!dimensions && dimL && dimW) {
          dimensions = {
            length: dimL,
            width: dimW,
            height: dimH || 1,
          };
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
  // Extract product slug and ID from Ozon URL
  // Formats: /product/slug-123456789/ or /product/123456789/
  const match = url.match(/ozon\.ru\/product\/((?:.*?-)?\d+)\/?/);
  if (!match) throw new Error("Не удалось извлечь ID товара из ссылки Ozon");

  const fullSlug = match[1]; // e.g. "some-product-name-123456789"
  const idMatch = fullSlug.match(/(\d+)$/);
  if (!idMatch) throw new Error("Не удалось извлечь ID товара из ссылки Ozon");
  const productId = idMatch[1];

  // Ozon blocks direct HTML fetching from server IPs.
  // Strategy 1: Try Ozon's internal composer API (returns JSON, different CDN rules)
  // Strategy 2: Try direct HTML fetch as fallback
  // Strategy 3: Try mobile API endpoint

  let name = "";
  let price = 0;
  let originalPrice = 0;
  let brand = "";
  let images: string[] = [];
  let category = "";
  let rating: number | null = null;
  let reviewCount: number | null = null;
  let weight: number | null = null;
  let dimensions: { length: number; width: number; height: number } | null = null;

  // --- Strategy 1: Ozon composer API ---
  try {
    const apiUrl = `https://api.ozon.ru/composer-api.bx/page/json/v2?url=${encodeURIComponent(`/product/${fullSlug}/`)}`;
    const apiRes = await fetchWithTimeout(apiUrl, {
      headers: {
        "User-Agent": "ozonapp_android/17.51.1+2558",
        "Accept": "application/json",
        "Accept-Language": "ru-RU",
      },
    }, 10000);

    if (apiRes.ok) {
      const apiData = await apiRes.json();
      // Parse the composer response (deeply nested structure)
      const widgetStates = apiData?.widgetStates || {};
      for (const [key, value] of Object.entries(widgetStates)) {
        try {
          const widget = typeof value === "string" ? JSON.parse(value) : value;

          // Product name from webProductHeading
          if (key.includes("webProductHeading") && widget?.title) {
            name = widget.title;
          }

          // Price from webPrice
          if (key.includes("webPrice") || key.includes("Price")) {
            if (widget?.price) {
              const priceStr = String(widget.price).replace(/[^\d.,]/g, "").replace(",", ".");
              price = parseFloat(priceStr) || price;
            }
            if (widget?.originalPrice) {
              const opStr = String(widget.originalPrice).replace(/[^\d.,]/g, "").replace(",", ".");
              originalPrice = parseFloat(opStr) || originalPrice;
            }
            if (widget?.cardPrice) {
              const cpStr = String(widget.cardPrice).replace(/[^\d.,]/g, "").replace(",", ".");
              if (!price) price = parseFloat(cpStr) || 0;
            }
          }

          // Images from webGallery
          if (key.includes("webGallery") && widget?.coverImage) {
            images = (widget.images || []).slice(0, 5).map((img: any) => img.src || img.originalSrc || "").filter(Boolean);
            if (images.length === 0 && widget.coverImage) {
              images = [widget.coverImage];
            }
          }

          // Brand
          if (key.includes("webBrand") && widget?.brandName) {
            brand = widget.brandName;
          }

          // Rating from webSingleProductRating
          if (key.includes("Rating") && widget?.rating) {
            rating = parseFloat(widget.rating) || null;
            reviewCount = parseInt(widget.reviewsCount || widget.commentsCount) || null;
          }
        } catch {
          // widget parse error, skip
        }
      }

      // Try to get category from breadcrumbs
      const layoutTrackingInfo = apiData?.layoutTrackingInfo;
      if (layoutTrackingInfo) {
        try {
          const trackInfo = typeof layoutTrackingInfo === "string" ? JSON.parse(layoutTrackingInfo) : layoutTrackingInfo;
          category = trackInfo?.categoryName || trackInfo?.category || "";
        } catch { /* ignore */ }
      }
    }
  } catch {
    // Strategy 1 failed, continue
  }

  // --- Strategy 2: Direct HTML fetch ---
  if (!name) {
    try {
      const pageRes = await fetchWithTimeout(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        redirect: "follow",
      }, 15000);

      if (pageRes.ok) {
        const html = await pageRes.text();

        // Extract from JSON-LD
        const jsonLdMatch = html.match(
          /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
        );

        if (jsonLdMatch) {
          for (const scriptTag of jsonLdMatch) {
            try {
              const jsonStr = scriptTag
                .replace(/<script type="application\/ld\+json">/, "")
                .replace(/<\/script>/, "");
              const jsonData = JSON.parse(jsonStr);

              if (jsonData["@type"] === "Product") {
                name = jsonData.name || name;
                brand = jsonData.brand?.name || brand;
                if (!images.length) {
                  images = jsonData.image
                    ? Array.isArray(jsonData.image)
                      ? jsonData.image.slice(0, 5)
                      : [jsonData.image]
                    : [];
                }
                if (jsonData.offers) {
                  const offers = Array.isArray(jsonData.offers)
                    ? jsonData.offers[0]
                    : jsonData.offers;
                  if (!price) price = parseFloat(offers.price) || 0;
                  if (!originalPrice) originalPrice = price;
                }
                if (jsonData.aggregateRating) {
                  rating = rating || (parseFloat(jsonData.aggregateRating.ratingValue) || null);
                  reviewCount = reviewCount || (parseInt(jsonData.aggregateRating.reviewCount) || null);
                }
                if (jsonData.category) category = category || jsonData.category;
              }

              if (jsonData["@type"] === "BreadcrumbList" && jsonData.itemListElement) {
                const items = jsonData.itemListElement;
                if (items.length > 1 && !category) {
                  category = items[items.length - 1]?.name || "";
                }
              }
            } catch { /* JSON parse error */ }
          }
        }

        // Fallback: meta tags
        if (!name) {
          const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
          if (ogTitle) name = ogTitle[1];
        }
        if (!images.length) {
          const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
          if (ogImage) images = [ogImage[1]];
        }
        if (!price) {
          const priceMatch = html.match(/<meta\s+property="product:price:amount"\s+content="([^"]+)"/);
          if (priceMatch) price = parseFloat(priceMatch[1]) || 0;
        }
      }
    } catch {
      // Strategy 2 failed, continue
    }
  }

  if (!originalPrice) originalPrice = price;

  if (!name) {
    throw new Error(
      "Ozon блокирует запросы с сервера. Попробуйте вставить ссылку на Wildberries — парсинг WB работает стабильно."
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
    weight,
    dimensions,
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
