import { NextRequest, NextResponse } from "next/server";
import { chromium, type Browser, type Page } from "playwright";
import { stat } from "fs/promises";
import nodePath from "path";

// ─── Config ─────────────────────────────────────────────────────────────────

const LOGIN_1688 = process.env.ALI_1688_LOGIN || "";
const PASSWORD_1688 = process.env.ALI_1688_PASSWORD || "";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Product1688 {
  product_id: string;
  title: string;
  price_range: string;
  min_price: number;
  max_price: number;
  images: string[];
  sale_quantity: string;
  company_name: string;
  location: string;
  moq: number;
  detail_url: string;
  source: "1688";
}

// ─── Launch browser ─────────────────────────────────────────────────────────

async function launchBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-networking",
      "--no-first-run",
      "--window-size=1920,1080",
    ],
  });
}

// ─── Login to 1688 ──────────────────────────────────────────────────────────

async function login1688(page: Page): Promise<boolean> {
  if (!LOGIN_1688 || !PASSWORD_1688) {
    console.log("[search-china] 1688 credentials not set, skipping login");
    return false;
  }

  try {
    console.log("[search-china] Navigating to 1688 login...");
    await page.goto("https://login.1688.com/member/signin.htm", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Wait for the login form to appear
    await page.waitForTimeout(2000);

    // Switch to password login tab if needed
    const passwordTab = page.locator(
      'div[data-loginmode="password"], [class*="password-login"], text=密码登录'
    );
    if (await passwordTab.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await passwordTab.first().click();
      await page.waitForTimeout(1000);
    }

    // 1688 login form can be inside an iframe
    let loginFrame: Page | import("playwright").Frame = page;

    const iframeEl = page.locator('iframe[id*="login"], iframe[src*="login"]');
    if (await iframeEl.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      const frameHandle = await iframeEl.first().elementHandle();
      const frame = frameHandle ? await frameHandle.contentFrame() : null;
      if (frame) {
        loginFrame = frame;
        console.log("[search-china] Found login iframe");
      }
    }

    // Fill login and password
    const loginInput = loginFrame.locator(
      'input[name="loginId"], input[name="username"], input[id*="login"], input[placeholder*="邮箱"], input[placeholder*="手机"], input[type="text"]'
    );
    const passwordInput = loginFrame.locator(
      'input[name="password"], input[type="password"]'
    );

    await loginInput.first().waitFor({ state: "visible", timeout: 10000 });
    await loginInput.first().fill(LOGIN_1688);
    await page.waitForTimeout(500);

    await passwordInput.first().waitFor({ state: "visible", timeout: 5000 });
    await passwordInput.first().fill(PASSWORD_1688);
    await page.waitForTimeout(500);

    // Click submit
    const submitBtn = loginFrame.locator(
      'button[type="submit"], [class*="login-btn"], [class*="submit"], button:has-text("登录")'
    );
    await submitBtn.first().click();

    // Wait for redirect after login
    await page.waitForTimeout(5000);

    // Check if login succeeded — should redirect away from login page
    const currentUrl = page.url();
    const isLoggedIn = !currentUrl.includes("login.1688.com");
    console.log("[search-china] Login result:", isLoggedIn ? "success" : "failed", "url:", currentUrl);

    return isLoggedIn;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[search-china] Login error:", msg);
    return false;
  }
}

// ─── Search 1688 by image (file upload) ─────────────────────────────────────

async function search1688ByImage(
  localFilePath: string
): Promise<{ products: Product1688[]; error: string; debug?: any }> {
  let browser: Browser | null = null;

  try {
    console.log("[search-china] Launching Playwright browser...");
    browser = await launchBrowser();
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      locale: "zh-CN",
      extraHTTPHeaders: {
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
    });
    const page = await context.newPage();

    // Login first
    const loggedIn = await login1688(page);
    console.log("[search-china] Logged in:", loggedIn);

    // Navigate to 1688 image search page
    console.log("[search-china] Navigating to 1688 image search page...");
    await page.goto("https://s.1688.com/youyuan/index.htm", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(2000);

    // Upload image file directly via the file input
    console.log("[search-china] Uploading image file:", localFilePath);
    const fileInput = page.locator('input[type="file"]');

    // 1688 may have hidden file inputs — make them all visible and use the first one
    const fileInputCount = await fileInput.count();
    console.log("[search-china] Found file inputs:", fileInputCount);

    if (fileInputCount > 0) {
      await fileInput.first().setInputFiles(localFilePath);
      console.log("[search-china] File uploaded via input");
    } else {
      // Fallback: try clicking the upload area to trigger file dialog
      // Look for the camera/upload icon area
      const uploadArea = page.locator(
        '[class*="upload"], [class*="camera"], [class*="image-search"], [class*="img-upload"]'
      );
      if (await uploadArea.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        // Use fileChooser event
        const [fileChooser] = await Promise.all([
          page.waitForEvent("filechooser", { timeout: 10000 }),
          uploadArea.first().click(),
        ]);
        await fileChooser.setFiles(localFilePath);
        console.log("[search-china] File uploaded via fileChooser");
      } else {
        console.log("[search-china] No upload element found, trying URL method as fallback");
        // Last resort: navigate with imageUrl param pointing to a public URL
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
        const relPath = localFilePath.replace(nodePath.join(process.cwd(), "public"), "");
        const fullUrl = `${appUrl}/api${relPath.replace(/^\/tmp/, "/tmp")}`;
        const encodedImg = encodeURIComponent(fullUrl);
        await page.goto(
          `https://s.1688.com/youyuan/index.htm?tab=imageSearch&imageUrl=${encodedImg}&imageType=oss`,
          { waitUntil: "domcontentloaded", timeout: 30000 }
        );
      }
    }

    // Wait for results to load
    console.log("[search-china] Waiting for search results...");
    try {
      await page.waitForSelector(
        '[class*="offer-card"], [class*="card-container"], [class*="img-item"], [class*="sm-offer"], a[href*="detail.1688.com"]',
        { timeout: 20000 }
      );
    } catch {
      console.log("[search-china] Timeout waiting for result selectors");
    }

    // Extra time for lazy loading
    await page.waitForTimeout(3000);

    // Scroll down to load more items
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(2000);

    // Extract products from the page
    const products = await page.evaluate((): any[] => {
      const results: any[] = [];
      const seenIds = new Set<string>();

      // Find product cards — 1688 uses various class patterns
      const cards = document.querySelectorAll(
        '[class*="offer-card"], [class*="card-container"], [class*="img-item"], [class*="sm-offer-card"]'
      );

      // Also try finding product links directly
      const productLinks = document.querySelectorAll(
        'a[href*="detail.1688.com/offer"], a[href*="offer/"], a[data-href*="detail.1688.com"]'
      );

      const processElement = (el: Element, link?: HTMLAnchorElement) => {
        if (results.length >= 5) return;

        // Find product link
        const anchor =
          link ||
          el.querySelector('a[href*="detail.1688.com"], a[href*="offer/"]') as HTMLAnchorElement | null;
        const href = anchor?.href || anchor?.getAttribute("data-href") || "";

        // Extract product ID
        const idMatch =
          href.match(/offer\/(\d+)\.html/) ||
          href.match(/offerId=(\d+)/) ||
          href.match(/\/(\d+)\.html/);
        if (!idMatch) return;

        const productId = idMatch[1];
        if (seenIds.has(productId)) return;
        seenIds.add(productId);

        // Title
        const titleEl = el.querySelector(
          '[class*="title"], [class*="name"], h4, h3, [class*="subject"]'
        );
        const title = titleEl?.textContent?.trim() || "";

        // Price
        const priceEl = el.querySelector('[class*="price"]');
        const priceText = priceEl?.textContent?.trim() || "";
        const priceMatch = priceText.match(/([\d.]+)/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : 0;

        // Max price (range)
        const allPrices = priceText.match(/[\d.]+/g);
        const maxPrice =
          allPrices && allPrices.length > 1
            ? parseFloat(allPrices[allPrices.length - 1])
            : price;

        // Image
        const imgEl = el.querySelector("img");
        let imgSrc =
          imgEl?.src ||
          imgEl?.getAttribute("data-src") ||
          imgEl?.getAttribute("data-lazy-src") ||
          "";
        if (imgSrc.startsWith("//")) imgSrc = "https:" + imgSrc;

        // Sold / quantity
        const soldEl = el.querySelector(
          '[class*="sale"], [class*="sold"], [class*="deal"], [class*="trade"]'
        );
        const soldText = soldEl?.textContent?.trim() || "";

        // Company
        const companyEl = el.querySelector(
          '[class*="company"], [class*="supplier"], [class*="seller"]'
        );
        const companyName = companyEl?.textContent?.trim() || "";

        // Location
        const locationEl = el.querySelector(
          '[class*="location"], [class*="address"], [class*="area"]'
        );
        const location = locationEl?.textContent?.trim() || "";

        // MOQ
        const moqEl = el.querySelector('[class*="moq"], [class*="min-order"]');
        const moqText = moqEl?.textContent?.trim() || "";
        const moqMatch = moqText.match(/(\d+)/);
        const moq = moqMatch ? parseInt(moqMatch[1], 10) : 1;

        if (title || price > 0 || imgSrc) {
          results.push({
            product_id: productId,
            title,
            price,
            maxPrice: maxPrice || price,
            imgSrc,
            soldText,
            companyName,
            location,
            moq,
            detail_url: href.startsWith("http")
              ? href
              : `https://detail.1688.com/offer/${productId}.html`,
          });
        }
      };

      // Process card elements
      cards.forEach((card) => processElement(card));

      // If no cards found, try processing links
      if (results.length === 0) {
        productLinks.forEach((link) => {
          const anchor = link as HTMLAnchorElement;
          // Walk up to find a parent container
          let container: Element = anchor;
          for (let i = 0; i < 6; i++) {
            if (container.parentElement) container = container.parentElement;
          }
          processElement(container, anchor);
        });
      }

      return results;
    });

    // Map raw results to typed products
    const typedProducts: Product1688[] = products.map((p) => ({
      product_id: p.product_id,
      title: p.title,
      price_range:
        p.price > 0
          ? p.maxPrice > p.price
            ? `¥${p.price.toFixed(2)} - ¥${p.maxPrice.toFixed(2)}`
            : `¥${p.price.toFixed(2)}`
          : "N/A",
      min_price: p.price,
      max_price: p.maxPrice || p.price,
      images: p.imgSrc ? [p.imgSrc] : [],
      sale_quantity: p.soldText,
      company_name: p.companyName,
      location: p.location,
      moq: p.moq || 1,
      detail_url: p.detail_url,
      source: "1688" as const,
    }));

    const finalUrl = page.url();
    console.log("[search-china] Final URL:", finalUrl);
    console.log("[search-china] Total products found:", typedProducts.length);

    return {
      products: typedProducts.slice(0, 5),
      error: typedProducts.length === 0 ? "Товары не найдены" : "",
      debug: {
        finalUrl,
        loggedIn,
        productsFound: typedProducts.length,
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

// ─── Resolve image to local file path ───────────────────────────────────────

const TMP_DIR = nodePath.join(process.cwd(), "public", "tmp");

async function resolveLocalImage(imageUrl: string): Promise<string | null> {
  // If it's our /api/tmp/ path, resolve to local file
  const match = imageUrl.match(/\/api\/tmp\/(.+)/);
  if (match) {
    const filePath = nodePath.join(TMP_DIR, match[1]);
    try {
      await stat(filePath);
      return filePath;
    } catch {
      return null;
    }
  }

  // If it's an external URL, not a local file
  return null;
}

// ─── Diagnostic GET endpoint ─────────────────────────────────────────────────

export async function GET() {
  let browserOk = false;
  let browserError = "";
  try {
    const browser = await launchBrowser();
    const version = browser.version();
    await browser.close();
    browserOk = true;
    browserError = version;
  } catch (e) {
    browserError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    method: "playwright-1688-image-search",
    browserOk,
    browserVersion: browserOk ? browserError : undefined,
    browserError: !browserOk ? browserError : undefined,
    credentials: LOGIN_1688 ? "set" : "NOT SET",
    status: browserOk ? "ready" : "error",
  });
}

// ─── Main POST Handler ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Не передана ссылка на изображение" },
        { status: 400 }
      );
    }

    console.log("[search-china] === 1688 image search start ===");
    console.log("[search-china] imageUrl:", imageUrl);

    // Resolve to local file path
    const localFile = await resolveLocalImage(imageUrl);
    console.log("[search-china] Local file resolved:", localFile || "NOT FOUND");

    if (!localFile) {
      return NextResponse.json({
        searchMethod: "image",
        totalFound: 0,
        products: [],
        debug: {
          imageUrl,
          method: "playwright-1688-upload",
          error1688: "Фото товара не найдено на диске",
          found1688: 0,
        },
      });
    }

    const result = await search1688ByImage(localFile);

    console.log("[search-china] === Result:", result.products.length, "products ===");

    return NextResponse.json({
      searchMethod: "image" as const,
      totalFound: result.products.length,
      products: result.products,
      ...(result.products.length === 0
        ? {
            debug: {
              imageUrl,
              method: "playwright-1688-upload",
              error1688: result.error || "Товары не найдены",
              found1688: 0,
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
