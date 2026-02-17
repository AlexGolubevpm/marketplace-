import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET ?? "cargo-revalidate-secret";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret, paths } = body as { secret: string; paths: string[] };

    if (secret !== REVALIDATE_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ error: "paths must be a non-empty array" }, { status: 400 });
    }

    const revalidated: string[] = [];

    for (const path of paths) {
      revalidatePath(path);
      revalidated.push(path);
    }

    // Always revalidate sitemap
    revalidatePath("/knowledge/sitemap.xml");

    return NextResponse.json({
      revalidated,
      now: Date.now(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to revalidate", details: String(err) },
      { status: 500 }
    );
  }
}
