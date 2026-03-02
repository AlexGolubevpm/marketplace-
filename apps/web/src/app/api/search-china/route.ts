import { NextRequest, NextResponse } from "next/server";

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

    // Generate search links for Chinese marketplaces
    const encodedName = encodeURIComponent(productName || "");
    const encodedImage = imageUrl ? encodeURIComponent(imageUrl) : "";

    const searchLinks: Record<string, string> = {};

    // 1688 search by text
    if (productName) {
      searchLinks.search1688 = `https://s.1688.com/selloffer/offer_search.htm?keywords=${encodedName}`;
    }

    // 1688 image search (if image URL available)
    if (imageUrl) {
      searchLinks.imageSearch1688 = `https://s.1688.com/youyuan/index.htm?tab=imageSearch&imageAddress=${encodedImage}&imageType=oss`;
    }

    // Taobao search by text
    if (productName) {
      searchLinks.searchTaobao = `https://s.taobao.com/search?q=${encodedName}`;
    }

    // AliExpress search by text
    if (productName) {
      searchLinks.searchAliExpress = `https://www.aliexpress.com/wholesale?SearchText=${encodedName}`;
    }

    // DHGate search
    if (productName) {
      searchLinks.searchDHGate = `https://www.dhgate.com/wholesale/search.do?searchkey=${encodedName}`;
    }

    return NextResponse.json({
      searchLinks,
      note: "В следующей версии здесь будут реальные результаты поиска с ценами из Китая",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Неизвестная ошибка";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
