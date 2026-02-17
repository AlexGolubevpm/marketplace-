import { Bot, Context, session, SessionFlavor, InlineKeyboard } from "grammy";

// ============================================
// Types
// ============================================
interface RequestDraft {
  origin_country?: string;
  origin_city?: string;
  destination_country?: string;
  destination_city?: string;
  cargo_description?: string;
  weight_kg?: string;
  volume_m3?: string;
  delivery_type?: string;
}

interface SessionData {
  role?: "customer" | "carrier";
  step?: string;
  requestDraft?: RequestDraft;
}

type MyContext = Context & SessionFlavor<SessionData>;

// ============================================
// Bot Setup
// ============================================
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN not set. Set it in .env or environment variables.");
  console.error("Get a token from @BotFather in Telegram.");
  process.exit(1);
}

const bot = new Bot<MyContext>(token);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Session
bot.use(session({ initial: (): SessionData => ({}) }));

// ============================================
// Helpers
// ============================================
const COUNTRY_NAMES: Record<string, string> = {
  CN: "Китай", TR: "Турция", DE: "Германия", IT: "Италия",
  RU: "Россия", KZ: "Казахстан", UZ: "Узбекистан", KG: "Кыргызстан",
};
const DELIVERY_LABELS: Record<string, string> = {
  air: "Авиа ✈️", sea: "Море 🚢", rail: "ЖД 🚂", road: "Авто 🚛", any: "Любой",
};

const STATUS_LABELS: Record<string, string> = {
  new: "🔵 Новая",
  matching: "🔵 Подбор карго",
  offers_received: "🟡 Есть офферы",
  offer_selected: "🟢 Оффер выбран",
  expired: "⚪ Истекла",
  closed: "⚪ Закрыта",
  cancelled: "⚪ Отменена",
  duplicate: "⚪ Дубликат",
  resubmitted: "🔵 Повторная",
};

const OFFER_STATUS_LABELS: Record<string, string> = {
  active: "⏳ Ожидает",
  selected: "✅ Выбран",
  rejected: "❌ Не выбран",
  expired: "⚪ Истёк",
};

function buildAuthUrl(user: { id: number; first_name: string; last_name?: string; username?: string }, role: string): string {
  const name = user.first_name + (user.last_name ? " " + user.last_name : "");
  return `${APP_URL}/auth/telegram?tg_id=${user.id}&name=${encodeURIComponent(name)}&username=${encodeURIComponent(user.username || "")}&role=${role}`;
}

function escMd(text: string): string {
  return text.replace(/[.\-!()#+=|{}>/\\]/g, "\\$&");
}

async function api(path: string, options?: RequestInit): Promise<any> {
  const url = `${APP_URL}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers },
    });
    return await res.json();
  } catch (err) {
    console.error(`API error ${path}:`, err);
    return null;
  }
}

// ============================================
// /start command
// ============================================
bot.command("start", async (ctx) => {
  const payload = ctx.match; // deep link parameter after ?start=

  // Handle deep link login from website
  if (payload === "login_customer") {
    ctx.session.role = "customer";
    const authUrl = buildAuthUrl(ctx.from!, "customer");

    const keyboard = new InlineKeyboard()
      .url("🌐 Войти в кабинет клиента", authUrl)
      .row()
      .text("📝 Создать заявку в боте", "new_request");

    await ctx.reply(
      `👋 Привет, *${escMd(ctx.from!.first_name)}*\\!\n\nНажмите кнопку ниже, чтобы войти в личный кабинет:`,
      { parse_mode: "MarkdownV2", reply_markup: keyboard }
    );
    return;
  }

  if (payload === "login_carrier") {
    ctx.session.role = "carrier";
    const authUrl = buildAuthUrl(ctx.from!, "carrier");

    const keyboard = new InlineKeyboard()
      .url("🌐 Войти в кабинет карго", authUrl)
      .row()
      .text("📋 Посмотреть заявки", "carrier_new_requests");

    await ctx.reply(
      `🚚 Привет, *${escMd(ctx.from!.first_name)}*\\!\n\nНажмите кнопку ниже, чтобы войти в кабинет карго:`,
      { parse_mode: "MarkdownV2", reply_markup: keyboard }
    );
    return;
  }

  // Default: role selection
  const keyboard = new InlineKeyboard()
    .text("📦 Я клиент — нужна доставка", "role_customer")
    .row()
    .text("🚚 Я карго — хочу получать заявки", "role_carrier");

  await ctx.reply(
    `🏗 *Добро пожаловать в Cargo Market\\!*\n\n` +
    `Мы помогаем найти лучшие условия доставки грузов\\.\n\n` +
    `🔹 *Клиентам* — создайте заявку и получите офферы от проверенных карго\\-компаний\n` +
    `🔹 *Карго* — получайте заявки и отправляйте предложения\n\n` +
    `Выберите вашу роль:`,
    { parse_mode: "MarkdownV2", reply_markup: keyboard }
  );
});

// ============================================
// Role selection
// ============================================
bot.callbackQuery("role_customer", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.role = "customer";
  await showCustomerMenu(ctx);
});

bot.callbackQuery("role_carrier", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.role = "carrier";
  await showCarrierMenu(ctx);
});

// ============================================
// Customer Flow
// ============================================
async function showCustomerMenu(ctx: MyContext) {
  const keyboard = new InlineKeyboard()
    .text("📝 Создать заявку", "new_request")
    .row()
    .text("📋 Мои заявки", "my_requests")
    .row()
    .text("🌐 Открыть кабинет", "open_cabinet")
    .row()
    .text("ℹ️ Помощь", "help_customer");

  await ctx.reply(
    `👋 *Кабинет клиента*\n\nЧто хотите сделать?`,
    { parse_mode: "MarkdownV2", reply_markup: keyboard }
  );
}

// --- Create Request ---
bot.callbackQuery("new_request", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.requestDraft = {};
  ctx.session.step = "origin_country";

  const keyboard = new InlineKeyboard()
    .text("🇨🇳 Китай", "country_from_CN")
    .text("🇹🇷 Турция", "country_from_TR")
    .row()
    .text("🇩🇪 Германия", "country_from_DE")
    .text("🇮🇹 Италия", "country_from_IT")
    .row()
    .text("◀️ Назад", "back_customer_menu");

  await ctx.reply("📍 *Откуда отправляем?*\n\nВыберите страну отправления:", {
    parse_mode: "MarkdownV2",
    reply_markup: keyboard,
  });
});

bot.callbackQuery(/^country_from_(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const country = ctx.match![1];
  ctx.session.requestDraft = { ...ctx.session.requestDraft, origin_country: country };
  ctx.session.step = "origin_city";

  await ctx.reply(
    `✅ Страна: *${COUNTRY_NAMES[country] || country}*\n\n🏙 Напишите *город отправления*:`,
    { parse_mode: "MarkdownV2" }
  );
});

bot.callbackQuery(/^country_to_(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const country = ctx.match![1];
  ctx.session.requestDraft = { ...ctx.session.requestDraft, destination_country: country };
  ctx.session.step = "destination_city";

  await ctx.reply(
    `✅ Страна: *${COUNTRY_NAMES[country] || country}*\n\n🏙 Напишите *город назначения*:`,
    { parse_mode: "MarkdownV2" }
  );
});

bot.callbackQuery(/^delivery_(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const type = ctx.match![1];
  ctx.session.requestDraft = { ...ctx.session.requestDraft, delivery_type: type };

  await showRequestSummary(ctx);
});

async function showRequestSummary(ctx: MyContext) {
  const d = ctx.session.requestDraft || {};

  const text = [
    `📋 *Ваша заявка:*\n`,
    `📍 *Откуда:* ${COUNTRY_NAMES[d.origin_country || ""] || d.origin_country}, ${d.origin_city}`,
    `📍 *Куда:* ${COUNTRY_NAMES[d.destination_country || ""] || d.destination_country}, ${d.destination_city}`,
    `📦 *Груз:* ${d.cargo_description}`,
    `⚖️ *Вес:* ${d.weight_kg} кг`,
    d.volume_m3 ? `📐 *Объём:* ${d.volume_m3} м³` : "",
    `🚚 *Доставка:* ${DELIVERY_LABELS[d.delivery_type || "any"] || d.delivery_type}`,
  ].filter(Boolean).join("\n");

  const keyboard = new InlineKeyboard()
    .text("✅ Отправить заявку", "submit_request")
    .row()
    .text("✏️ Изменить", "new_request")
    .text("❌ Отменить", "back_customer_menu");

  await ctx.reply(escMd(text), {
    parse_mode: "MarkdownV2",
    reply_markup: keyboard,
  });
}

// --- Submit Request (REAL API CALL) ---
bot.callbackQuery("submit_request", async (ctx) => {
  await ctx.answerCallbackQuery();
  const d = ctx.session.requestDraft || {};
  const tgId = String(ctx.from!.id);
  const userName = ctx.from!.first_name + (ctx.from!.last_name ? " " + ctx.from!.last_name : "");

  const result = await api("/api/requests", {
    method: "POST",
    body: JSON.stringify({
      customer_id: tgId,
      customer_name: userName,
      origin_country: d.origin_country,
      origin_city: d.origin_city,
      destination_country: d.destination_country,
      destination_city: d.destination_city,
      cargo_description: d.cargo_description,
      weight_kg: d.weight_kg ? parseFloat(d.weight_kg) : null,
      volume_m3: d.volume_m3 ? parseFloat(d.volume_m3) : null,
      delivery_type_preferred: d.delivery_type !== "any" ? d.delivery_type : null,
      source: "telegram_bot",
    }),
  });

  if (result && result.display_id) {
    await ctx.reply(
      `🎉 *Заявка ${escMd(result.display_id)} создана\\!*\n\n` +
      `Мы отправили её подходящим карго\\-компаниям\\.\n` +
      `Ожидайте офферы — обычно первые ответы приходят *в течение 1\\-2 часов*\\.\n\n` +
      `Мы пришлём уведомление, когда появятся предложения\\!`,
      { parse_mode: "MarkdownV2" }
    );
  } else {
    await ctx.reply(
      "❌ Не удалось создать заявку\\. Попробуйте ещё раз или создайте через личный кабинет\\.",
      { parse_mode: "MarkdownV2" }
    );
  }

  ctx.session.requestDraft = {};
  ctx.session.step = undefined;

  setTimeout(() => showCustomerMenu(ctx), 1000);
});

// --- My Requests (REAL API CALL) ---
bot.callbackQuery("my_requests", async (ctx) => {
  await ctx.answerCallbackQuery();
  const tgId = String(ctx.from!.id);
  const authUrl = buildAuthUrl(ctx.from!, "customer");

  const requests = await api(`/api/requests?customer_id=${tgId}`);

  let text: string;
  if (!requests || !Array.isArray(requests) || requests.length === 0) {
    text = "📋 *Ваши заявки:*\n\nУ вас пока нет заявок\\. Создайте первую\\!";
  } else {
    text = "📋 *Ваши заявки:*\n\n";
    const shown = requests.slice(0, 5);
    for (const r of shown) {
      const statusLabel = STATUS_LABELS[r.status] || r.status;
      const route = `${COUNTRY_NAMES[r.origin_country] || r.origin_country}, ${r.origin_city} → ${COUNTRY_NAMES[r.destination_country] || r.destination_country}, ${r.destination_city}`;
      const offerInfo = r.offer_count > 0 ? ` \\(${r.offer_count} офферов\\)` : "";
      text += `${statusLabel} *${escMd(r.display_id)}*\n${escMd(route)}${offerInfo}\n\n`;
    }
    if (requests.length > 5) {
      text += `_\\.\\.\\. и ещё ${requests.length - 5}_\n`;
    }
  }

  const keyboard = new InlineKeyboard()
    .url("🌐 Подробнее в кабинете", authUrl)
    .row()
    .text("📝 Новая заявка", "new_request")
    .row()
    .text("◀️ Назад", "back_customer_menu");

  await ctx.reply(text, {
    parse_mode: "MarkdownV2",
    reply_markup: keyboard,
  });
});

// --- Open Cabinet ---
bot.callbackQuery("open_cabinet", async (ctx) => {
  await ctx.answerCallbackQuery();
  const authUrl = buildAuthUrl(ctx.from!, "customer");

  const keyboard = new InlineKeyboard()
    .url("🌐 Войти в кабинет", authUrl)
    .row()
    .text("◀️ Назад", "back_customer_menu");

  await ctx.reply("Нажмите кнопку — вы автоматически войдёте в кабинет:", {
    reply_markup: keyboard,
  });
});

// --- Help ---
bot.callbackQuery("help_customer", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    `ℹ️ *Как это работает:*\n\n` +
    `1\\. Создайте заявку — опишите груз и маршрут\n` +
    `2\\. Получите офферы от карго\\-компаний\n` +
    `3\\. Сравните цены и условия\n` +
    `4\\. Выберите лучший вариант\n` +
    `5\\. Отслеживайте доставку\n\n` +
    `📩 Вопросы? Напишите /support`,
    { parse_mode: "MarkdownV2" }
  );
});

bot.callbackQuery("back_customer_menu", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showCustomerMenu(ctx);
});

// ============================================
// Carrier Flow
// ============================================
async function showCarrierMenu(ctx: MyContext) {
  const keyboard = new InlineKeyboard()
    .text("📋 Новые заявки", "carrier_new_requests")
    .row()
    .text("📊 Мои офферы", "carrier_my_offers")
    .row()
    .text("🌐 Открыть кабинет", "carrier_open_cabinet")
    .row()
    .text("ℹ️ Помощь", "help_carrier");

  await ctx.reply(
    `🚚 *Кабинет карго*\n\nЧто хотите сделать?`,
    { parse_mode: "MarkdownV2", reply_markup: keyboard }
  );
}

// --- Carrier: New Requests (REAL API CALL) ---
bot.callbackQuery("carrier_new_requests", async (ctx) => {
  await ctx.answerCallbackQuery();
  const authUrl = buildAuthUrl(ctx.from!, "carrier");

  // Fetch requests with status new or matching (available for offers)
  const requests = await api("/api/requests");

  let text: string;
  if (!requests || !Array.isArray(requests) || requests.length === 0) {
    text = "📋 *Новые заявки:*\n\nСейчас нет доступных заявок\\. Проверьте позже\\!";
  } else {
    // Show only new/matching requests
    const available = requests.filter((r: any) => ["new", "matching", "offers_received"].includes(r.status));
    if (available.length === 0) {
      text = "📋 *Новые заявки:*\n\nСейчас нет доступных заявок\\. Проверьте позже\\!";
    } else {
      text = "📋 *Новые заявки для вас:*\n\n";
      const shown = available.slice(0, 5);
      for (const r of shown) {
        const route = `${COUNTRY_NAMES[r.origin_country] || r.origin_country}, ${r.origin_city} → ${COUNTRY_NAMES[r.destination_country] || r.destination_country}, ${r.destination_city}`;
        const weight = r.weight_kg ? `${r.weight_kg} кг` : "—";
        const created = new Date(r.created_at);
        const dateStr = `${created.getDate()}.${String(created.getMonth() + 1).padStart(2, "0")}`;
        text += `📦 *${escMd(r.display_id)}*\n${escMd(route)} | ${escMd(weight)}\n📅 ${dateStr}\n\n`;
      }
      if (available.length > 5) {
        text += `_\\.\\.\\. и ещё ${available.length - 5} заявок_\n`;
      }
    }
  }

  const keyboard = new InlineKeyboard()
    .url("🌐 Ответить в кабинете", authUrl)
    .row()
    .text("◀️ Назад", "back_carrier_menu");

  await ctx.reply(text, {
    parse_mode: "MarkdownV2",
    reply_markup: keyboard,
  });
});

// --- Carrier: My Offers (REAL API CALL) ---
bot.callbackQuery("carrier_my_offers", async (ctx) => {
  await ctx.answerCallbackQuery();
  const tgId = String(ctx.from!.id);
  const authUrl = buildAuthUrl(ctx.from!, "carrier");

  const offers = await api(`/api/offers?carrier_id=${tgId}`);

  let text: string;
  if (!offers || !Array.isArray(offers) || offers.length === 0) {
    text = "📊 *Ваши офферы:*\n\nУ вас пока нет офферов\\. Просмотрите заявки и отправьте предложение\\!";
  } else {
    text = "📊 *Ваши офферы:*\n\n";
    const shown = offers.slice(0, 5);
    for (const o of shown) {
      const statusLabel = OFFER_STATUS_LABELS[o.status] || o.status;
      const price = o.price ? `$${o.price}` : "—";
      const days = o.estimated_days ? `${o.estimated_days} дн` : "";
      text += `${statusLabel}\n*${escMd(o.display_id)}* — ${escMd(price)}${days ? `, ${escMd(days)}` : ""}\n\n`;
    }
    if (offers.length > 5) {
      text += `_\\.\\.\\. и ещё ${offers.length - 5}_\n`;
    }
  }

  const keyboard = new InlineKeyboard()
    .url("🌐 Подробнее в кабинете", authUrl)
    .row()
    .text("◀️ Назад", "back_carrier_menu");

  await ctx.reply(text, {
    parse_mode: "MarkdownV2",
    reply_markup: keyboard,
  });
});

bot.callbackQuery("carrier_open_cabinet", async (ctx) => {
  await ctx.answerCallbackQuery();
  const authUrl = buildAuthUrl(ctx.from!, "carrier");

  const keyboard = new InlineKeyboard()
    .url("🌐 Войти в кабинет", authUrl)
    .row()
    .text("◀️ Назад", "back_carrier_menu");

  await ctx.reply("Нажмите кнопку — вы автоматически войдёте в кабинет:", {
    reply_markup: keyboard,
  });
});

bot.callbackQuery("help_carrier", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    `ℹ️ *Как работает Cargo Market для карго:*\n\n` +
    `1\\. Вы получаете уведомления о новых заявках\n` +
    `2\\. Отвечаете оффером \\(цена, сроки, условия\\)\n` +
    `3\\. Если клиент выбирает вас — вы получаете заказ\n` +
    `4\\. Выполняете доставку и получаете оплату\n\n` +
    `📩 Вопросы? Напишите /support`,
    { parse_mode: "MarkdownV2" }
  );
});

bot.callbackQuery("back_carrier_menu", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showCarrierMenu(ctx);
});

// ============================================
// Text message handler (for form steps)
// ============================================
bot.on("message:text", async (ctx) => {
  const step = ctx.session.step;
  const text = ctx.message.text;

  if (!step) return;

  switch (step) {
    case "origin_city": {
      ctx.session.requestDraft = { ...ctx.session.requestDraft, origin_city: text };
      ctx.session.step = "destination_country";

      const keyboard = new InlineKeyboard()
        .text("🇷🇺 Россия", "country_to_RU")
        .text("🇰🇿 Казахстан", "country_to_KZ")
        .row()
        .text("🇺🇿 Узбекистан", "country_to_UZ")
        .text("🇰🇬 Кыргызстан", "country_to_KG");

      await ctx.reply("📍 *Куда доставляем?*\n\nВыберите страну назначения:", {
        parse_mode: "MarkdownV2",
        reply_markup: keyboard,
      });
      break;
    }

    case "destination_city": {
      ctx.session.requestDraft = { ...ctx.session.requestDraft, destination_city: text };
      ctx.session.step = "cargo_description";

      await ctx.reply("📦 *Что везём?*\n\nОпишите груз \\(например: электроника, одежда, запчасти\\):", {
        parse_mode: "MarkdownV2",
      });
      break;
    }

    case "cargo_description": {
      ctx.session.requestDraft = { ...ctx.session.requestDraft, cargo_description: text };
      ctx.session.step = "weight";

      await ctx.reply("⚖️ *Вес груза* в кг \\(например: 1500\\):", {
        parse_mode: "MarkdownV2",
      });
      break;
    }

    case "weight": {
      ctx.session.requestDraft = { ...ctx.session.requestDraft, weight_kg: text };
      ctx.session.step = "volume";

      await ctx.reply(
        "📐 *Объём груза* в м³ \\(например: 12\\.5\\)\\.\n\nНапишите объём или отправьте *\\-* если не знаете:",
        { parse_mode: "MarkdownV2" }
      );
      break;
    }

    case "volume": {
      const volume = text === "-" ? undefined : text;
      ctx.session.requestDraft = { ...ctx.session.requestDraft, volume_m3: volume };
      ctx.session.step = "delivery_type";

      const keyboard = new InlineKeyboard()
        .text("✈️ Авиа", "delivery_air")
        .text("🚢 Море", "delivery_sea")
        .row()
        .text("🚂 ЖД", "delivery_rail")
        .text("🚛 Авто", "delivery_road")
        .row()
        .text("🔄 Любой", "delivery_any");

      await ctx.reply("🚚 *Предпочтительный тип доставки:*", {
        parse_mode: "MarkdownV2",
        reply_markup: keyboard,
      });
      break;
    }

    default:
      break;
  }
});

// ============================================
// Commands
// ============================================
bot.command("menu", async (ctx) => {
  if (ctx.session.role === "carrier") {
    await showCarrierMenu(ctx);
  } else {
    await showCustomerMenu(ctx);
  }
});

bot.command("support", async (ctx) => {
  await ctx.reply(
    "📩 Для связи с поддержкой напишите на:\n\n" +
    "Email: support@cargomarket.com\n" +
    "Или опишите проблему здесь — мы ответим в течение часа."
  );
});

// ============================================
// Start Bot
// ============================================
console.log("🚀 Cargo Market Bot starting...");
bot.start({
  onStart: (botInfo) => {
    console.log(`✅ Bot @${botInfo.username} is running!`);
    console.log(`   App URL: ${APP_URL}`);
  },
});
