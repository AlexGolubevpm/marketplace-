import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { knowledgeRedirects } from "@cargo/db";

// Cache redirects in memory per process (gets reset on deploy)
let redirectMap: Map<string, string> | null = null;
let cacheBuiltAt = 0;
const CACHE_TTL = 60 * 1000; // 60s — short enough to pick up admin changes quickly

async function getRedirectMap(): Promise<Map<string, string>> {
  if (redirectMap && Date.now() - cacheBuiltAt < CACHE_TTL) {
    return redirectMap;
  }

  const redirects = await db.select().from(knowledgeRedirects);
  redirectMap = new Map(redirects.map((r) => [r.from_path, r.to_path]));
  cacheBuiltAt = Date.now();
  return redirectMap;
}

/** Bust the in-process redirect cache. */
function bustRedirectCache() {
  redirectMap = null;
  cacheBuiltAt = 0;
}

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ to: null }, { status: 400 });
  }

  try {
    const map = await getRedirectMap();
    const to = map.get(path) ?? null;
    return NextResponse.json({ to }, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch {
    return NextResponse.json({ to: null }, { status: 500 });
  }
}

/** POST /api/knowledge-redirect-check — bust the cache */
export async function POST() {
  bustRedirectCache();
  return NextResponse.json({ ok: true });
}
