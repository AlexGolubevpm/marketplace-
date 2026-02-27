/**
 * Telegram admin notification service.
 * Sends admin alerts (new registrations, new requests, new offer responses)
 * to a configured Telegram chat.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cargomarketplace.ru";

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function sendAdminMessage(text: string): Promise<boolean> {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
    console.warn("[TG Admin] TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not set, skipping");
    return false;
  }

  try {
    const res = await fetch(`${TG_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[TG Admin] Failed to send:", err);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[TG Admin] Error:", err);
    return false;
  }
}

/**
 * Notify admin about a new customer registration.
 */
export async function notifyAdminNewCustomer(params: {
  customerId: string;
  name?: string;
  email?: string;
  company?: string;
  source: string;
}): Promise<boolean> {
  const nameLine = params.name ? `\n👤 Имя: <b>${escHtml(params.name)}</b>` : "";
  const emailLine = params.email ? `\n📧 Email: ${escHtml(params.email)}` : "";
  const companyLine = params.company ? `\n🏢 Компания: ${escHtml(params.company)}` : "";

  const text =
    `🆕 <b>Новая регистрация клиента</b>\n` +
    `${nameLine}${emailLine}${companyLine}\n` +
    `📱 Источник: ${escHtml(params.source)}\n\n` +
    `🔗 <a href="${APP_URL}/admin/customers/${params.customerId}">Открыть в админке</a>`;

  return sendAdminMessage(text);
}

/**
 * Notify admin about a new carrier registration.
 */
export async function notifyAdminNewCarrier(params: {
  carrierId: string;
  name?: string;
  email?: string;
  company?: string;
  source: string;
}): Promise<boolean> {
  const nameLine = params.name ? `\n👤 Имя: <b>${escHtml(params.name)}</b>` : "";
  const emailLine = params.email ? `\n📧 Email: ${escHtml(params.email)}` : "";
  const companyLine = params.company ? `\n🏢 Компания: ${escHtml(params.company)}` : "";

  const text =
    `🚚 <b>Новая регистрация карго</b>\n` +
    `${nameLine}${emailLine}${companyLine}\n` +
    `📱 Источник: ${escHtml(params.source)}\n\n` +
    `🔗 <a href="${APP_URL}/admin/carriers/${params.carrierId}">Открыть в админке</a>`;

  return sendAdminMessage(text);
}

/**
 * Notify admin about a new cargo request.
 */
export async function notifyAdminNewRequest(params: {
  requestId: string;
  displayId: string;
  customerName?: string;
  customerEmail?: string;
  route: string;
  cargo: string;
  weight?: string;
  deliveryType?: string;
  source: string;
}): Promise<boolean> {
  const customerLine = params.customerName
    ? `\n👤 Клиент: <b>${escHtml(params.customerName)}</b>`
    : "";
  const emailLine = params.customerEmail ? ` (${escHtml(params.customerEmail)})` : "";
  const weightLine = params.weight ? `\n⚖️ Вес: ${escHtml(params.weight)} кг` : "";
  const deliveryLine = params.deliveryType ? `\n🚛 Тип: ${escHtml(params.deliveryType)}` : "";

  const text =
    `📦 <b>Новая заявка ${escHtml(params.displayId)}</b>\n` +
    `${customerLine}${emailLine}\n` +
    `📍 Маршрут: ${escHtml(params.route)}\n` +
    `📋 Груз: ${escHtml(params.cargo)}${weightLine}${deliveryLine}\n` +
    `📱 Источник: ${escHtml(params.source)}\n\n` +
    `🔗 <a href="${APP_URL}/admin/requests/${params.requestId}">Открыть в админке</a>`;

  return sendAdminMessage(text);
}

/**
 * Notify admin about a new offer on a request.
 */
export async function notifyAdminNewOffer(params: {
  offerId: string;
  offerDisplayId: string;
  requestDisplayId: string;
  carrierName?: string;
  price: string;
  currency: string;
  estimatedDays: number;
  deliveryType: string;
}): Promise<boolean> {
  const DELIVERY_LABELS: Record<string, string> = {
    air: "Авиа", sea: "Море", rail: "ЖД", road: "Авто", multimodal: "Мультимодал",
  };

  const carrierLine = params.carrierName
    ? `\n🚚 Карго: <b>${escHtml(params.carrierName)}</b>`
    : "";

  const text =
    `🎯 <b>Новый оффер ${escHtml(params.offerDisplayId)}</b>\n` +
    `📦 На заявку: ${escHtml(params.requestDisplayId)}${carrierLine}\n` +
    `💰 Цена: <b>${escHtml(params.price)} ${escHtml(params.currency)}</b>\n` +
    `📅 Срок: ${params.estimatedDays} дн.\n` +
    `🚛 Тип: ${DELIVERY_LABELS[params.deliveryType] || params.deliveryType}\n\n` +
    `🔗 <a href="${APP_URL}/admin/offers/${params.offerId}">Открыть оффер</a>`;

  return sendAdminMessage(text);
}

/**
 * Notify admin about offer selection (customer chose an offer).
 */
export async function notifyAdminOfferSelected(params: {
  offerDisplayId: string;
  requestDisplayId: string;
  carrierName?: string;
  price: string;
  currency: string;
  orderDisplayId: string;
}): Promise<boolean> {
  const carrierLine = params.carrierName
    ? `\n🚚 Карго: <b>${escHtml(params.carrierName)}</b>`
    : "";

  const text =
    `✅ <b>Оффер ${escHtml(params.offerDisplayId)} выбран!</b>\n` +
    `📦 Заявка: ${escHtml(params.requestDisplayId)}${carrierLine}\n` +
    `💰 Цена: <b>${escHtml(params.price)} ${escHtml(params.currency)}</b>\n` +
    `📋 Заказ: <b>${escHtml(params.orderDisplayId)}</b>`;

  return sendAdminMessage(text);
}

/**
 * Notify admin about a new cargo quote form submission from knowledge base.
 */
export async function notifyAdminCargoQuote(params: {
  name: string;
  phone?: string;
  email?: string;
  route: string;
  cargo: string;
  weight?: string;
  comment?: string;
}): Promise<boolean> {
  const phoneLine = params.phone ? `\n📞 Телефон: ${escHtml(params.phone)}` : "";
  const emailLine = params.email ? `\n📧 Email: ${escHtml(params.email)}` : "";
  const weightLine = params.weight ? `\n⚖️ Вес: ${escHtml(params.weight)} кг` : "";
  const commentLine = params.comment ? `\n💬 Комментарий: ${escHtml(params.comment)}` : "";

  const text =
    `🔥 <b>Новая заявка с базы знаний!</b>\n\n` +
    `👤 Имя: <b>${escHtml(params.name)}</b>${phoneLine}${emailLine}\n\n` +
    `📍 Маршрут: ${escHtml(params.route)}\n` +
    `📋 Груз: ${escHtml(params.cargo)}${weightLine}${commentLine}`;

  return sendAdminMessage(text);
}
