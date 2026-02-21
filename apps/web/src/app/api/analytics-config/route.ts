import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/analytics-config
 * Returns analytics configuration (Yandex Metrika, Google Analytics, verification codes).
 * Public endpoint — data is fetched from landing_content section "analytics".
 * Cached for 5 minutes.
 */
export async function GET() {
  try {
    const [content] = await db
      .select()
      .from(schema.landingContent)
      .where(
        and(
          eq(schema.landingContent.section, "analytics"),
          eq(schema.landingContent.is_published, true)
        )
      )
      .orderBy(desc(schema.landingContent.version))
      .limit(1);

    if (!content) {
      return NextResponse.json({});
    }

    return NextResponse.json(content.content, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error: any) {
    console.error("GET /api/analytics-config error:", error.message);
    return NextResponse.json({});
  }
}
