import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware handles 301 redirects for the knowledge base.
 * Redirect records are stored in the database and checked
 * via an internal API route to avoid Edge/Postgres compatibility issues.
 *
 * Runs only on /knowledge/* paths to minimize overhead.
 */
export const config = {
  matcher: ["/knowledge/:path*", "/knowledge-base/:path*", "/knowledge-base"],
};

// In-memory cache: { path -> { to, expires } }
const redirectCache = new Map<string, { to: string; expires: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Redirect legacy /knowledge-base → /knowledge (301)
  if (pathname === "/knowledge-base" || pathname.startsWith("/knowledge-base/")) {
    return NextResponse.redirect(
      new URL("/knowledge", request.url),
      { status: 301 }
    );
  }

  // Skip internal paths
  if (
    pathname.startsWith("/knowledge/search") ||
    pathname.startsWith("/knowledge/faq") ||
    pathname.startsWith("/knowledge/category") ||
    pathname.startsWith("/knowledge/tag") ||
    pathname === "/knowledge"
  ) {
    return NextResponse.next();
  }

  // Check in-memory cache first
  const cached = redirectCache.get(pathname);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.redirect(new URL(cached.to, request.url), { status: 301 });
  }

  // Check redirect via internal API
  try {
    const apiUrl = new URL(
      `/api/knowledge-redirect-check?path=${encodeURIComponent(pathname)}`,
      request.url
    );
    const res = await fetch(apiUrl.toString(), {
      headers: { "x-internal": "1" },
      signal: AbortSignal.timeout(2000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.to) {
        // Cache it
        redirectCache.set(pathname, { to: data.to, expires: Date.now() + CACHE_TTL_MS });
        return NextResponse.redirect(new URL(data.to, request.url), { status: 301 });
      }
    }
  } catch {
    // If the redirect check fails, continue normally
  }

  return NextResponse.next();
}
