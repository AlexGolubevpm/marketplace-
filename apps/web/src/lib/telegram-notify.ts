/**
 * Telegram notification service.
 * Sends messages to users via Telegram Bot API (no grammY dependency).
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export interface TelegramNotifyOptions {
  chatId: string; // Telegram user ID
  text: string; // Message text (MarkdownV2)
  parseMode?: "MarkdownV2" | "HTML";
}

/**
 * Send a Telegram message to a specific chat/user.
 * Returns true on success, false on failure.
 */
export async function sendTelegramMessage(opts: TelegramNotifyOptions): Promise<boolean> {
  if (!BOT_TOKEN) {
    console.warn("[TG Notify] TELEGRAM_BOT_TOKEN not set, skipping notification");
    return false;
  }

  try {
    const res = await fetch(`${TG_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: opts.chatId,
        text: opts.text,
        parse_mode: opts.parseMode || "HTML",
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[TG Notify] Failed to send:", err);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[TG Notify] Error:", err);
    return false;
  }
}

// Escape special HTML characters
function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const STATUS_LABELS_RU: Record<string, string> = {
  new: "Новая",
  matching: "Подбор карго",
  offers_received: "Есть офферы",
  offer_selected: "Оффер выбран",
  expired: "Истекла",
  closed: "Закрыта",
  cancelled: "Отменена",
  duplicate: "Дубликат",
  resubmitted: "Повторная",
};

const ORDER_STATUS_LABELS_RU: Record<string, string> = {
  payment_pending: "Ожидание оплаты",
  confirmed: "Подтверждён",
  awaiting_shipment: "Ожидание отправки",
  in_transit: "В пути",
  customs: "Таможня",
  customs_hold: "Задержка на таможне",
  delivered: "Доставлен",
  completed: "Завершён",
  cancelled: "Отменён",
  dispute: "Спор",
  on_hold: "На паузе",
  partially_delivered: "Частично доставлен",
  return: "Возврат",
};

const STATUS_EMOJI: Record<string, string> = {
  new: "🔵",
  matching: "🔍",
  offers_received: "🟡",
  offer_selected: "🟢",
  expired: "⏰",
  closed: "⚪",
  cancelled: "❌",
};

const ORDER_STATUS_EMOJI: Record<string, string> = {
  payment_pending: "💳",
  confirmed: "✅",
  awaiting_shipment: "📦",
  in_transit: "🚚",
  customs: "🛃",
  customs_hold: "⚠️",
  delivered: "📬",
  completed: "🎉",
  cancelled: "❌",
  dispute: "⚖️",
  on_hold: "⏸",
  partially_delivered: "📦",
  return: "↩️",
};

/**
 * Notify customer about request status change.
 */
export async function notifyRequestStatusChanged(params: {
  customerTelegramId: string;
  displayId: string;
  oldStatus: string;
  newStatus: string;
  route?: string;
}): Promise<boolean> {
  const emoji = STATUS_EMOJI[params.newStatus] || "📋";
  const statusLabel = STATUS_LABELS_RU[params.newStatus] || params.newStatus;
  const routeInfo = params.route ? `\n📍 ${escHtml(params.route)}` : "";

  const text =
    `${emoji} <b>Статус заявки ${escHtml(params.displayId)} изменён</b>\n\n` +
    `Новый статус: <b>${escHtml(statusLabel)}</b>${routeInfo}\n\n` +
    `Откройте личный кабинет для подробной информации.`;

  return sendTelegramMessage({ chatId: params.customerTelegramId, text });
}

/**
 * Notify customer about a new offer on their request.
 */
export async function notifyNewOffer(params: {
  customerTelegramId: string;
  requestDisplayId: string;
  offerPrice: string;
  offerCurrency: string;
  estimatedDays: number;
  carrierName: string;
}): Promise<boolean> {
  const text =
    `🎯 <b>Новый оффер на заявку ${escHtml(params.requestDisplayId)}</b>\n\n` +
    `🚚 Карго: <b>${escHtml(params.carrierName)}</b>\n` +
    `💰 Цена: <b>${escHtml(params.offerPrice)} ${escHtml(params.offerCurrency)}</b>\n` +
    `📅 Срок: <b>${params.estimatedDays} дн.</b>\n\n` +
    `Откройте личный кабинет, чтобы сравнить офферы и выбрать лучший.`;

  return sendTelegramMessage({ chatId: params.customerTelegramId, text });
}

/**
 * Notify customer about order status change.
 */
export async function notifyOrderStatusChanged(params: {
  customerTelegramId: string;
  orderDisplayId: string;
  oldStatus: string;
  newStatus: string;
  comment?: string;
}): Promise<boolean> {
  const emoji = ORDER_STATUS_EMOJI[params.newStatus] || "📦";
  const statusLabel = ORDER_STATUS_LABELS_RU[params.newStatus] || params.newStatus;
  const commentLine = params.comment ? `\n💬 ${escHtml(params.comment)}` : "";

  const text =
    `${emoji} <b>Статус заказа ${escHtml(params.orderDisplayId)} обновлён</b>\n\n` +
    `Новый статус: <b>${escHtml(statusLabel)}</b>${commentLine}\n\n` +
    `Подробности — в личном кабинете.`;

  return sendTelegramMessage({ chatId: params.customerTelegramId, text });
}

/**
 * Notify customer about a new message from carrier.
 */
export async function notifyNewMessage(params: {
  recipientTelegramId: string;
  senderName: string;
  requestDisplayId: string;
  messagePreview: string;
}): Promise<boolean> {
  const preview = params.messagePreview.length > 100
    ? params.messagePreview.slice(0, 100) + "..."
    : params.messagePreview;

  const text =
    `💬 <b>Новое сообщение по заявке ${escHtml(params.requestDisplayId)}</b>\n\n` +
    `От: <b>${escHtml(params.senderName)}</b>\n` +
    `📝 ${escHtml(preview)}\n\n` +
    `Откройте чат в личном кабинете для ответа.`;

  return sendTelegramMessage({ chatId: params.recipientTelegramId, text });
}

/**
 * Notify carrier about a new request matching their profile.
 */
export async function notifyCarrierNewRequest(params: {
  carrierTelegramId: string;
  requestDisplayId: string;
  route: string;
  weight?: string;
  deliveryType?: string;
}): Promise<boolean> {
  const weightLine = params.weight ? `\n⚖️ Вес: ${escHtml(params.weight)} кг` : "";
  const deliveryLine = params.deliveryType ? `\n🚚 Тип: ${escHtml(params.deliveryType)}` : "";

  const text =
    `📦 <b>Новая заявка ${escHtml(params.requestDisplayId)}</b>\n\n` +
    `📍 ${escHtml(params.route)}${weightLine}${deliveryLine}\n\n` +
    `Откройте кабинет карго, чтобы отправить оффер.`;

  return sendTelegramMessage({ chatId: params.carrierTelegramId, text });
}
