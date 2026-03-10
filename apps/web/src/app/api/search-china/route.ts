import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser, Page, HTTPResponse } from "puppeteer-core";

puppeteer.use(StealthPlugin());

// ─── Config ─────────────────────────────────────────────────────────────────

const CHROME_PATH =
  process.env.PUPPETEER_EXECUTABLE_PATH ||
  process.env.CHROME_PATH ||
  "/usr/bin/chromium-browser";

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

// ─── Launch browser ─────────────────────────────────────────────────────────

async function launchBrowser(): Promise<Browser> {
  const browser = await (puppeteer as any).launch({
    headless: "new",
    executablePath: CHROME_PATH,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-default-apps",
      "--no-first-run",
      "--window-size=1920,1080",
    ],
    defaultViewport: { width: 1920, height: 1080 },
    timeout: 30000,
  });

  return browser as Browser;
}

// ─── Search AliExpress by image ─────────────────────────────────────────────

async function searchAliExpressByImage(
  imageUrl: string
): Promise<{ products: DetailedProduct[]; error: string; debug?: any }> {
  let browser: Browser | null = null;

  try {
    console.log("[search-china] Launching browser...");
    browser = await launchBrowser();
    const page = await browser.newPage();

    // Realistic browser fingerprint
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
    });

    // Intercept API responses that contain product data
    const apiProducts: any[] = [];
    page.on("response", async (response: HTTPResponse) => {
      const url = response.url();
      // AliExpress internal search API endpoints
      if (
        (url.includes("/fn/search-pc/") ||
          url.includes("/aer-api/") ||
          url.includes("searchImageResult") ||
          url.includes("image_search") ||
          url.includes("/glosearch/")) &&
        response.status() === 200
      ) {
        try {
          const json = await response.json();
          console.log("[search-china] Intercepted API:", url.slice(0, 120));
          apiProducts.push(json);
        } catch {
          // not JSON, ignore
        }
      }
    });

    // Navigate to AliExpress image search
    const encodedImg = encodeURIComponent(imageUrl);
    const searchUrl = `https://www.aliexpress.com/wholesale?SearchText=&catId=0&initiative_id=SB_${Date.now()}&isPremium=y&imgUrl=${encodedImg}`;

    console.log("[search-china] Navigating to:", searchUrl);
    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Wait for products to load
    console.log("[search-china] Waiting for products to load...");
    try {
      await page.waitForSelector(
        'a[href*="/item/"], [class*="manhattan--container"], [class*="search-card-item"], [class*="product-card"]',
        { timeout: 15000 }
      );
    } catch {
      console.log("[search-china] Timeout waiting for product selectors");
    }

    // Give extra time for API responses and lazy-loaded content
    await new Promise((r) => setTimeout(r, 3000));

    // Strategy 1: Parse intercepted API responses
    let products: DetailedProduct[] = [];
    if (apiProducts.length > 0) {
      console.log("[search-china] Parsing", apiProducts.length, "API responses...");
      for (const data of apiProducts) {
        const items = findProductItems(data);
        if (items.length > 0) {
          products = parseApiItems(items);
          console.log("[search-china] Got", products.length, "products from API");
          break;
        }
      }
    }

    // Strategy 2: Extract from page SSR data
    if (products.length === 0) {
      console.log("[search-china] Trying SSR data extraction...");
      products = await extractSSRProducts(page);
    }

    // Strategy 3: Scrape DOM directly
    if (products.length === 0) {
      console.log("[search-china] Trying DOM scraping...");
      products = await scrapeDOMProducts(page);
    }

    const finalUrl = page.url();
    console.log("[search-china] Final URL:", finalUrl);
    console.log("[search-china] Total products found:", products.length);

    return {
      products: products.slice(0, 15),
      error: products.length === 0 ? "Товары не найдены" : "",
      debug: {
        finalUrl,
        apiResponsesIntercepted: apiProducts.length,
        productsFound: products.length,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[search-china] Error:", msg);
    return { products: [], error: msg };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

// ─── Find product items in nested API response ─────────────────────────────

function findProductItems(obj: any, depth = 0): any[] {
  if (depth > 10 || !obj || typeof obj !== "object") return [];

  const keys = ["items", "itemList", "productList", "products", "resultList"];
  for (const key of keys) {
    if (Array.isArray(obj[key]) && obj[key].length > 0) {
      const first = obj[key][0];
      if (
        first &&
        typeof first === "object" &&
        (first.title || first.productId || first.product_id || first.itemId || first.prices)
      ) {
        return obj[key];
      }
    }
  }

  // AliExpress "mods" structure
  if (obj.mods && typeof obj.mods === "object") {
    for (const modKey of Object.keys(obj.mods)) {
      const mod = obj.mods[modKey];
      if (mod?.content && Array.isArray(mod.content) && mod.content.length > 0) {
        const first = mod.content[0];
        if (first && (first.title || first.productId || first.prices)) {
          return mod.content;
        }
      }
    }
  }

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      const found = findProductItems(obj[key], depth + 1);
      if (found.length > 0) return found;
    }
  }

  return [];
}

// ─── Parse API response items ───────────────────────────────────────────────

function parseApiItems(items: any[]): DetailedProduct[] {
  return items
    .map((item: any): DetailedProduct | null => {
      const productId = String(
        item.productId || item.product_id || item.itemId || item.item_id || item.id || ""
      );
      if (!productId) return null;

      // Title
      const title =
        item.title?.displayTitle ||
        item.title?.seoTitle ||
        (typeof item.title === "string" ? item.title : "") ||
        item.product_title ||
        item.productTitle ||
        item.name ||
        "";

      // Price
      let price = 0;
      let maxPrice = 0;
      if (item.prices) {
        const sp = item.prices.salePrice;
        if (sp) {
          price = parseFloat(sp.minPrice || sp.formattedPrice?.replace(/[^0-9.]/g, "") || "0") || 0;
          maxPrice = parseFloat(sp.maxPrice || "0") || price;
        }
      } else {
        const raw = item.price || item.salePrice || item.sale_price || item.min_price || "0";
        price = typeof raw === "string" ? parseFloat(raw.replace(/[^0-9.]/g, "")) || 0 : parseFloat(raw) || 0;
        maxPrice = price;
      }

      // Image
      const images: string[] = [];
      const imgUrl =
        item.image?.imgUrl ||
        item.imageUrl ||
        item.image_url ||
        item.product_main_image_url ||
        (typeof item.image === "string" ? item.image : "") ||
        "";
      if (imgUrl) {
        images.push(imgUrl.startsWith("//") ? "https:" + imgUrl : imgUrl);
      }

      // Sales
      const salesCount =
        item.trade?.tradeDesc ||
        item.trade?.sold ||
        (item.lastest_volume != null ? String(item.lastest_volume) : "") ||
        (item.orders != null ? String(item.orders) : "") ||
        "";

      // Store
      const storeName =
        item.store?.storeName || item.shop_name || item.shopName || item.seller_name || "";

      // Location
      const location =
        item.logistics?.shipFrom || item.ship_from || item.shipFrom || item.location || "";

      if (!title && price === 0) return null;

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
          `https://www.aliexpress.com/item/${productId}.html`,
        source: "aliexpress" as const,
      };
    })
    .filter((p): p is DetailedProduct => p !== null);
}

// ─── Extract products from SSR data embedded in page ────────────────────────

async function extractSSRProducts(page: Page): Promise<DetailedProduct[]> {
  const ssrData = await page.evaluate(() => {
    // Try to access global SSR variables
    const w = window as any;
    return (
      w.__INIT_DATA__ ||
      w.runParams ||
      w._dida_config_ ||
      null
    );
  });

  if (ssrData) {
    const items = findProductItems(ssrData);
    if (items.length > 0) {
      console.log("[search-china] Found", items.length, "items in SSR data");
      return parseApiItems(items);
    }
  }

  return [];
}

// ─── Scrape products directly from DOM ──────────────────────────────────────

async function scrapeDOMProducts(page: Page): Promise<DetailedProduct[]> {
  return page.evaluate(() => {
    const results: any[] = [];
    const seenIds = new Set<string>();

    // Find all product links
    const links = document.querySelectorAll(
      'a[href*="/item/"], a[href*="aliexpress.com/item"]'
    );

    links.forEach((link) => {
      if (results.length >= 15) return;

      const href = (link as HTMLAnchorElement).href || "";
      const idMatch = href.match(/\/item\/(\d+)\.html/) || href.match(/\/(\d+)\.html/);
      if (!idMatch) return;

      const productId = idMatch[1];
      if (seenIds.has(productId)) return;
      seenIds.add(productId);

      // Walk up to find the card container
      let card: Element = link;
      for (let i = 0; i < 6; i++) {
        if (card.parentElement) card = card.parentElement;
      }

      // Title
      const titleEl =
        card.querySelector('[class*="title" i], [class*="name" i], h1, h3') ||
        link.querySelector('[class*="title" i], h1, h3');
      const title = titleEl?.textContent?.trim() || "";

      // Price — try multiple patterns
      const priceEl = card.querySelector('[class*="price" i]');
      const priceText = priceEl?.textContent?.trim() || "";
      // Match patterns like "$1.23", "US $1.23", "1,23", "12.34"
      const priceMatch = priceText.match(
        /(?:US\s*\$|USD\s*|\$)\s*([\d,]+\.?\d*)|(\d+[.,]\d{2})/
      );
      const price = priceMatch
        ? parseFloat((priceMatch[1] || priceMatch[2]).replace(",", "."))
        : 0;

      // Image
      const imgEl = card.querySelector("img") || link.querySelector("img");
      let imgSrc = imgEl?.src || imgEl?.getAttribute("data-src") || "";
      if (imgSrc.startsWith("//")) imgSrc = "https:" + imgSrc;

      // Sold count
      const soldEl = card.querySelector(
        '[class*="sold" i], [class*="order" i], [class*="trade" i]'
      );
      const soldText = soldEl?.textContent?.trim() || "";

      // Store
      const storeEl = card.querySelector('[class*="store" i], [class*="shop" i]');
      const storeName = storeEl?.textContent?.trim() || "";

      if (title || price > 0 || imgSrc) {
        results.push({
          product_id: productId,
          title,
          price,
          imgSrc,
          soldText,
          storeName,
          detail_url: href.startsWith("http")
            ? href
            : `https://www.aliexpress.com/item/${productId}.html`,
        });
      }
    });

    return results;
  }).then((raw) =>
    raw.map(
      (p: any): DetailedProduct => ({
        product_id: p.product_id,
        title: p.title,
        brand: "",
        price_range: p.price > 0 ? `$${p.price.toFixed(2)}` : "N/A",
        min_price: p.price,
        max_price: p.price,
        price_tiers: p.price > 0 ? [{ price: p.price, min_qty: 1 }] : [],
        unit_weight_kg: null,
        images: p.imgSrc ? [p.imgSrc] : [],
        sale_quantity: p.soldText,
        company_name: p.storeName,
        location: "",
        moq: 1,
        attributes: {},
        detail_url: p.detail_url,
        source: "aliexpress" as const,
      })
    )
  );
}

// ─── Diagnostic GET endpoint ─────────────────────────────────────────────────

export async function GET() {
  // Quick check that Chromium is available
  let chromiumOk = false;
  let chromiumError = "";
  try {
    const browser = await launchBrowser();
    const version = await browser.version();
    await browser.close();
    chromiumOk = true;
    chromiumError = version;
  } catch (e) {
    chromiumError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    method: "puppeteer-image-search",
    chromePath: CHROME_PATH,
    chromiumOk,
    chromiumVersion: chromiumOk ? chromiumError : undefined,
    chromiumError: !chromiumOk ? chromiumError : undefined,
    status: chromiumOk ? "ready" : "error",
  });
}

// ─── Search AliExpress by text query ────────────────────────────────────────

async function searchAliExpressByText(
  query: string
): Promise<{ products: DetailedProduct[]; error: string; debug?: any }> {
  let browser: Browser | null = null;

  try {
    console.log("[search-china] Text search, launching browser...");
    browser = await launchBrowser();
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

    const apiProducts: any[] = [];
    page.on("response", async (response: HTTPResponse) => {
      const url = response.url();
      if (
        (url.includes("/fn/search-pc/") ||
          url.includes("/aer-api/") ||
          url.includes("/glosearch/")) &&
        response.status() === 200
      ) {
        try {
          const json = await response.json();
          console.log("[search-china] Intercepted text API:", url.slice(0, 120));
          apiProducts.push(json);
        } catch {
          // not JSON
        }
      }
    });

    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://www.aliexpress.com/wholesale?SearchText=${encodedQuery}&sortType=total_tranpro_desc`;

    console.log("[search-china] Text search URL:", searchUrl);
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

    try {
      await page.waitForSelector(
        'a[href*="/item/"], [class*="manhattan--container"], [class*="search-card-item"], [class*="product-card"]',
        { timeout: 15000 }
      );
    } catch {
      console.log("[search-china] Timeout waiting for text search selectors");
    }

    await new Promise((r) => setTimeout(r, 3000));

    let products: DetailedProduct[] = [];
    if (apiProducts.length > 0) {
      for (const data of apiProducts) {
        const items = findProductItems(data);
        if (items.length > 0) {
          products = parseApiItems(items);
          break;
        }
      }
    }
    if (products.length === 0) products = await extractSSRProducts(page);
    if (products.length === 0) products = await scrapeDOMProducts(page);

    const finalUrl = page.url();
    console.log("[search-china] Text search found:", products.length, "products");

    return {
      products: products.slice(0, 15),
      error: products.length === 0 ? "Товары не найдены" : "",
      debug: { finalUrl, query, productsFound: products.length },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[search-china] Text search error:", msg);
    return { products: [], error: msg };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

// ─── Verify image URL is accessible ────────────────────────────────────────

async function isImageAccessible(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { method: "HEAD", signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Main POST Handler ──────────────────────────────────────────────────────

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

    console.log("[search-china] === Search start ===");
    console.log("[search-china] imageUrl:", imageUrl);
    console.log("[search-china] productTitle:", productTitle);

    let result: { products: DetailedProduct[]; error: string; debug?: any };
    let searchMethod: "image" | "text" | "image+text" = "image";

    // Try image search first if we have a valid image URL
    if (imageUrl) {
      const imageOk = await isImageAccessible(imageUrl);
      console.log("[search-china] Image accessible:", imageOk);

      if (imageOk) {
        result = await searchAliExpressByImage(imageUrl);

        // If image search found nothing and we have a title, try text search
        if (result.products.length === 0 && productTitle) {
          console.log("[search-china] Image search empty, falling back to text...");
          result = await searchAliExpressByText(productTitle);
          searchMethod = "image+text";
        }
      } else {
        // Image is 404, go straight to text search
        console.log("[search-china] Image URL is 404, using text search...");
        if (productTitle) {
          result = await searchAliExpressByText(productTitle);
          searchMethod = "text";
        } else {
          result = { products: [], error: "Фото товара недоступно (404) и не указано название" };
          searchMethod = "image";
        }
      }
    } else {
      // No image, text search only
      result = await searchAliExpressByText(productTitle);
      searchMethod = "text";
    }

    console.log("[search-china] === Result:", result.products.length, "products, method:", searchMethod, "===");

    return NextResponse.json({
      searchMethod,
      totalFound: result.products.length,
      products: result.products,
      ...(result.products.length === 0
        ? {
            debug: {
              imageUrl,
              productTitle,
              method: "puppeteer",
              errorAliexpress: result.error || "Товары не найдены",
              foundAliexpress: 0,
              ...result.debug,
            },
          }
        : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("[search-china] Handler error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
