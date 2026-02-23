// Status colors for UI badges
export const statusColors: Record<string, string> = {
  // Customer
  active: "green",
  banned: "red",
  inactive: "gray",

  // Carrier
  suspended: "yellow",
  blocked: "red",
  pending_review: "blue",

  // Request
  new: "blue",
  matching: "indigo",
  offers_received: "purple",
  offer_selected: "green",
  expired: "orange",
  closed: "gray",
  cancelled: "red",
  duplicate: "gray",
  resubmitted: "blue",

  // Offer
  selected: "green",
  rejected: "red",
  hidden: "gray",
  suspicious: "orange",

  // Order
  payment_pending: "yellow",
  confirmed: "blue",
  awaiting_shipment: "indigo",
  in_transit: "purple",
  customs: "orange",
  customs_hold: "red",
  delivered: "green",
  completed: "emerald",
  dispute: "red",
  on_hold: "yellow",
  partially_delivered: "orange",
  return: "red",

  // Notification
  pending: "yellow",
  sent: "blue",
  delivered_notif: "green",
  failed: "red",
};

// SLA thresholds (defaults, in minutes unless specified)
export const SLA_DEFAULTS = {
  FIRST_OFFER_WARNING_MINUTES: 120, // 2 hours
  FIRST_OFFER_CRITICAL_MINUTES: 240, // 4 hours
  MIN_OFFERS_WARNING_COUNT: 2,
  MIN_OFFERS_WARNING_HOURS: 6,
  MIN_OFFERS_CRITICAL_COUNT: 1,
  MIN_OFFERS_CRITICAL_HOURS: 12,
  ORDER_CONFIRM_WARNING_MINUTES: 60,
  ORDER_CONFIRM_CRITICAL_MINUTES: 180,
  CARRIER_RESPONSE_WARNING_MINUTES: 240,
  CARRIER_RESPONSE_CRITICAL_MINUTES: 480,
  CARRIER_RESPONSE_RATE_WARNING: 70,
  CARRIER_RESPONSE_RATE_CRITICAL: 50,
};

// KPI targets for Dashboard coloring
export const KPI_TARGETS = {
  AVG_FIRST_RESPONSE: { good: 60, acceptable: 240 }, // minutes
  OFFERS_PER_REQUEST: { good: 3, acceptable: 1 },
  CONVERSION_RATE: { good: 60, acceptable: 30 }, // percent
  SLA_VIOLATIONS_24H: { good: 0, acceptable: 3 },
};

// Display ID prefixes
export const ID_PREFIX = {
  REQUEST: "REQ",
  OFFER: "OFF",
  ORDER: "ORD",
} as const;

// Delivery type labels
export const deliveryTypeLabels: Record<string, string> = {
  air: "Авиа",
  sea: "Море",
  rail: "ЖД",
  road: "Авто",
  multimodal: "Мультимодальный",
};

// Cargo type labels
export const cargoTypeLabels: Record<string, string> = {
  general: "Обычный",
  fragile: "Хрупкий",
  dangerous: "Опасный",
  perishable: "Скоропортящийся",
  oversized: "Негабаритный",
};

// Status labels (Russian)
export const requestStatusLabels: Record<string, string> = {
  new: "Новая",
  matching: "Матчинг",
  offers_received: "Есть офферы",
  offer_selected: "Оффер выбран",
  expired: "Просрочена",
  closed: "Закрыта",
  cancelled: "Отменена",
  duplicate: "Дубликат",
  resubmitted: "Пересоздана",
};

export const orderStatusLabels: Record<string, string> = {
  payment_pending: "Ожидает оплаты",
  confirmed: "Подтверждён",
  awaiting_shipment: "Ждёт отправки",
  in_transit: "В пути",
  customs: "На таможне",
  customs_hold: "Задержан на таможне",
  delivered: "Доставлен",
  completed: "Завершён",
  cancelled: "Отменён",
  dispute: "Спор",
  on_hold: "Приостановлен",
  partially_delivered: "Частично доставлен",
  return: "Возврат",
};

export const offerStatusLabels: Record<string, string> = {
  active: "Активный",
  selected: "Выбран",
  rejected: "Отклонён",
  expired: "Истёк",
  hidden: "Скрыт",
  suspicious: "Подозрительный",
};

export const carrierStatusLabels: Record<string, string> = {
  active: "Активный",
  suspended: "Приостановлен",
  blocked: "Заблокирован",
  pending_review: "На проверке",
};

export const customerStatusLabels: Record<string, string> = {
  active: "Активный",
  banned: "Забанен",
  inactive: "Неактивный",
};

export const adminRoleLabels: Record<string, string> = {
  super_admin: "Супер-администратор",
  operator: "Оператор",
  analyst: "Аналитик",
  content_manager: "Контент-менеджер",
};

// Document type labels
export const documentTypeLabels: Record<string, string> = {
  invoice: "Инвойс",
  customs_declaration: "Таможенная декларация",
  bill_of_lading: "Коносамент",
  photo: "Фото",
  contract: "Договор",
  other: "Другое",
};

// Currency options
export const currencyOptions = ["USD", "EUR", "RUB", "CNY"] as const;

// Source labels
export const requestSourceLabels: Record<string, string> = {
  web_form: "Web",
  telegram_bot: "Telegram",
  admin_manual: "Админ",
  api: "API",
};
