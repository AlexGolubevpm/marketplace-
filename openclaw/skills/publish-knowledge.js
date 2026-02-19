/**
 * publish-knowledge — OpenClaw skill
 *
 * Вспомогательный скилл для Content Manager бота.
 * Агент использует этот скилл при /publish команде.
 * При обычном тексте без команды агент действует по AGENTS.md.
 */

export const meta = {
  name: "publish-knowledge",
  description:
    "Публикует SEO-статью в базу знаний cargo-marketplace. " +
    "Вызывай когда пользователь отправляет статью или просит опубликовать материал.",
  triggers: ["/publish", "/публикую"],
};

export async function run({ message, llm, http, reply, env }) {
  const apiUrl = env.CARGO_API_URL || "http://web:3000";
  const botKey = env.BOT_API_KEY;

  if (!botKey) {
    await reply("❌ BOT_API_KEY не настроен.");
    return;
  }

  const articleText = message.text
    .replace(/^\/(publish|публикую)\s*/i, "")
    .trim();

  if (articleText.length < 50) {
    await reply("📝 Пришли текст статьи после команды /publish");
    return;
  }

  await reply("⏳ Загружаю существующие категории и теги...");

  // Загружаем существующие категории и теги
  const [catsRes, tagsRes] = await Promise.all([
    http.get(`${apiUrl}/api/knowledge-publish?type=categories`, {
      headers: { "X-Bot-Key": botKey },
    }),
    http.get(`${apiUrl}/api/knowledge-publish?type=tags`, {
      headers: { "X-Bot-Key": botKey },
    }),
  ]);

  const { categories = [] } = await catsRes.json();
  const { tags = [] } = await tagsRes.json();

  await reply("🤖 Анализирую статью...");

  // LLM извлекает параметры
  const extraction = await llm.chat([
    {
      role: "system",
      content: `Ты SEO-эксперт. Извлеки параметры из статьи и верни ТОЛЬКО валидный JSON.

Существующие категории (используй их slug если подходят):
${JSON.stringify(categories.map((c) => ({ slug: c.slug, title: c.title })))}

Существующие теги (используй их slug если подходят):
${JSON.stringify(tags.map((t) => ({ slug: t.slug, title: t.title })))}

Правила:
- slug: только латиница и дефисы, 3-6 слов
- description: 120-160 символов с ключевым словом
- category_slug: один из существующих или null
- tag_slugs: массив из существующих slug (до 5 штук)
- faq_items: 3-5 вопросов-ответов по теме
- sources: источники если есть

Верни ТОЛЬКО JSON:
{
  "title": "...",
  "slug": "...",
  "description": "...",
  "content": "...полный markdown...",
  "category_slug": "...",
  "tag_slugs": [],
  "faq_items": [{"question": "...", "answer": "..."}],
  "sources": [],
  "author_name": null,
  "is_featured": false
}`,
    },
    { role: "user", content: articleText },
  ]);

  let params;
  try {
    const raw = extraction.content.trim().replace(/^```json\s*|```\s*$/g, "");
    params = JSON.parse(raw);
  } catch {
    await reply("❌ Не удалось разобрать параметры. Попробуй ещё раз.");
    return;
  }

  // Публикуем
  const res = await http.post(`${apiUrl}/api/knowledge-publish`, {
    headers: {
      "Content-Type": "application/json",
      "X-Bot-Key": botKey,
    },
    body: JSON.stringify({ type: "article", status: "published", ...params }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    await reply(`❌ Ошибка: ${err.error || res.status}`);
    return;
  }

  const data = await res.json();

  await reply(
    `✅ *Опубликовано!*\n\n` +
      `📌 **${params.title}**\n` +
      `🔗 https://cargomarketplace.ru${data.url}\n` +
      `🏷 Теги: ${params.tag_slugs?.join(", ") || "нет"}\n` +
      `❓ FAQ: ${params.faq_items?.length || 0} пунктов`
  );
}
