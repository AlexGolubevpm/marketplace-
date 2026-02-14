import { Bot, Context, session, SessionFlavor, InlineKeyboard, Keyboard } from "grammy";
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";

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

type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor;
type MyConversation = Conversation<MyContext>;

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

// Conversations
bot.use(conversations());

// ============================================
// /start command
// ============================================
bot.command("start", async (ctx) => {
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
  const names: Record<string, string> = { CN: "Китай", TR: "Турция", DE: "Германия", IT: "Италия" };
  ctx.session.requestDraft = { ...ctx.session.requestDraft, origin_country: country };
  ctx.session.step = "origin_city";

  await ctx.reply(
    `✅ Страна: *${names[country] || country}*\n\n🏙 Напишите *город отправления*:`,
    { parse_mode: "MarkdownV2" }
  );
});

bot.callbackQuery(/^country_to_(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const country = ctx.match![1];
  const names: Record<string, string> = { RU: "Россия", KZ: "Казахстан", UZ: "Узбекистан", KG: "Кыргызстан" };
  ctx.session.requestDraft = { ...ctx.session.requestDraft, destination_country: country };
  ctx.session.step = "destination_city";

  await ctx.reply(
    `✅ Страна: *${names[country] || country}*\n\n🏙 Напишите *город назначения*:`,
    { parse_mode: "MarkdownV2" }
  );
});

bot.callbackQuery(/^delivery_(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const type = ctx.match![1];
  const labels: Record<string, string> = { air: "Авиа", sea: "Море", rail: "ЖД", road: "Авто", any: "Любой" };
  ctx.session.requestDraft = { ...ctx.session.requestDraft, delivery_type: type };

  await showRequestSummary(ctx);
});

async function showRequestSummary(ctx: MyContext) {
  const d = ctx.session.requestDraft || {};
  const countries: Record<string, string> = { CN: "Китай", TR: "Турция", DE: "Германия", IT: "Италия", RU: "Россия", KZ: "Казахстан", UZ: "Узбекистан", KG: "Кыргызстан" };
  const deliveryLabels: Record<string, string> = { air: "Авиа ✈️", sea: "Море 🚢", rail: "ЖД 🚂", road: "Авто 🚛", any: "Любой" };

  const text = [
    `📋 *Ваша заявка:*\n`,
    `📍 *Откуда:* ${countries[d.origin_country || ""] || d.origin_country}, ${d.origin_city}`,
    `📍 *Куда:* ${countries[d.destination_country || ""] || d.destination_country}, ${d.destination_city}`,
    `📦 *Груз:* ${d.cargo_description}`,
    `⚖️ *Вес:* ${d.weight_kg} кг`,
    d.volume_m3 ? `📐 *Объём:* ${d.volume_m3} м³` : "",
    `🚚 *Доставка:* ${deliveryLabels[d.delivery_type || "any"] || d.delivery_type}`,
  ].filter(Boolean).join("\n");

  const keyboard = new InlineKeyboard()
    .text("✅ Отправить заявку", "submit_request")
    .row()
    .text("✏️ Изменить", "new_request")
    .text("❌ Отменить", "back_customer_menu");

  await ctx.reply(text.replace(/[.\-!()]/g, "\\$&"), {
    parse_mode: "MarkdownV2",
    reply_markup: keyboard,
  });
}

bot.callbackQuery("submit_request", async (ctx) => {
  await ctx.answerCallbackQuery("✅ Заявка отправлена!");
  const d = ctx.session.requestDraft || {};

  // Generate mock display ID
  const displayId = `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  await ctx.reply(
    `🎉 *Заявка ${displayId} создана\\!*\n\n` +
    `Мы отправили её подходящим карго\\-компаниям\\.\n` +
    `Ожидайте офферы — обычно первые ответы приходят *в течение 1\\-2 часов*\\.\n\n` +
    `Мы пришлём уведомление, когда появятся предложения\\!`,
    { parse_mode: "MarkdownV2" }
  );

  ctx.session.requestDraft = {};
  ctx.session.step = undefined;

  setTimeout(() => showCustomerMenu(ctx), 1000);
});

// --- My Requests ---
bot.callbackQuery("my_requests", async (ctx) => {
  await ctx.answerCallbackQuery();

  // Mock data
  const requests = [
    { id: "REQ-2026-0142", route: "Shenzhen → Moscow", status: "Есть офферы (3)", statusEmoji: "🟡" },
    { id: "REQ-2026-0139", route: "Istanbul → Almaty", status: "В доставке", statusEmoji: "🟣" },
    { id: "REQ-2026-0135", route: "Guangzhou → Tashkent", status: "Завершено", statusEmoji: "🟢" },
  ];

  let text = "📋 *Ваши заявки:*\n\n";
  requests.forEach((r) => {
    text += `${r.statusEmoji} *${r.id}*\n${r.route}\nСтатус: ${r.status}\n\n`;
  });

  const keyboard = new InlineKeyboard()
    .url("🌐 Подробнее в кабинете", `${APP_URL}/c/requests`)
    .row()
    .text("◀️ Назад", "back_customer_menu");

  await ctx.reply(text.replace(/[.\-!()]/g, "\\$&"), {
    parse_mode: "MarkdownV2",
    reply_markup: keyboard,
  });
});

// --- Open Cabinet ---
bot.callbackQuery("open_cabinet", async (ctx) => {
  await ctx.answerCallbackQuery();
  const keyboard = new InlineKeyboard()
    .url("🌐 Открыть кабинет клиента", `${APP_URL}/c/requests`)
    .row()
    .text("◀️ Назад", "back_customer_menu");

  await ctx.reply("Нажмите кнопку ниже, чтобы перейти в личный кабинет:", {
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

bot.callbackQuery("carrier_new_requests", async (ctx) => {
  await ctx.answerCallbackQuery();

  const requests = [
    { id: "REQ-2026-0142", route: "Shenzhen → Moscow", weight: "1 500 кг", deadline: "15 фев" },
    { id: "REQ-2026-0141", route: "Guangzhou → Almaty", weight: "800 кг", deadline: "14 фев" },
    { id: "REQ-2026-0140", route: "Istanbul → Novosibirsk", weight: "2 300 кг", deadline: "14 фев" },
  ];

  let text = "📋 *Новые заявки для вас:*\n\n";
  requests.forEach((r) => {
    text += `📦 *${r.id}*\n${r.route} | ${r.weight}\n⏰ Дедлайн: ${r.deadline}\n\n`;
  });

  const keyboard = new InlineKeyboard()
    .url("🌐 Ответить в кабинете", `${APP_URL}/s/requests`)
    .row()
    .text("◀️ Назад", "back_carrier_menu");

  await ctx.reply(text.replace(/[.\-!()]/g, "\\$&"), {
    parse_mode: "MarkdownV2",
    reply_markup: keyboard,
  });
});

bot.callbackQuery("carrier_my_offers", async (ctx) => {
  await ctx.answerCallbackQuery();

  const offers = [
    { route: "Istanbul → Moscow", price: "$3,800", status: "✅ Выбран" },
    { route: "Shenzhen → Ekaterinburg", price: "$5,500", status: "⏳ Ожидает" },
    { route: "Yiwu → Bishkek", price: "$2,900", status: "❌ Не выбран" },
  ];

  let text = "📊 *Ваши офферы:*\n\n";
  offers.forEach((o) => {
    text += `${o.status}\n${o.route} — ${o.price}\n\n`;
  });

  const keyboard = new InlineKeyboard()
    .url("🌐 Подробнее в кабинете", `${APP_URL}/s/offers`)
    .row()
    .text("◀️ Назад", "back_carrier_menu");

  await ctx.reply(text.replace(/[.\-!()]/g, "\\$&"), {
    parse_mode: "MarkdownV2",
    reply_markup: keyboard,
  });
});

bot.callbackQuery("carrier_open_cabinet", async (ctx) => {
  await ctx.answerCallbackQuery();
  const keyboard = new InlineKeyboard()
    .url("🌐 Открыть кабинет карго", `${APP_URL}/s/requests`)
    .row()
    .text("◀️ Назад", "back_carrier_menu");

  await ctx.reply("Нажмите кнопку ниже, чтобы перейти в кабинет:", {
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
