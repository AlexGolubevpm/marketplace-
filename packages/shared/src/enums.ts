// ============================================
// Customer
// ============================================
export const CustomerStatus = {
  ACTIVE: "active",
  BANNED: "banned",
  INACTIVE: "inactive",
} as const;
export type CustomerStatus = (typeof CustomerStatus)[keyof typeof CustomerStatus];
export const customerStatuses = Object.values(CustomerStatus);

// ============================================
// Carrier
// ============================================
export const CarrierStatus = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  BLOCKED: "blocked",
  PENDING_REVIEW: "pending_review",
} as const;
export type CarrierStatus = (typeof CarrierStatus)[keyof typeof CarrierStatus];
export const carrierStatuses = Object.values(CarrierStatus);

// ============================================
// Delivery Type
// ============================================
export const DeliveryType = {
  AIR: "air",
  SEA: "sea",
  RAIL: "rail",
  ROAD: "road",
  MULTIMODAL: "multimodal",
} as const;
export type DeliveryType = (typeof DeliveryType)[keyof typeof DeliveryType];
export const deliveryTypes = Object.values(DeliveryType);

// ============================================
// Cargo Type
// ============================================
export const CargoType = {
  GENERAL: "general",
  FRAGILE: "fragile",
  DANGEROUS: "dangerous",
  PERISHABLE: "perishable",
  OVERSIZED: "oversized",
} as const;
export type CargoType = (typeof CargoType)[keyof typeof CargoType];
export const cargoTypes = Object.values(CargoType);

// ============================================
// Request
// ============================================
export const RequestStatus = {
  NEW: "new",
  MATCHING: "matching",
  OFFERS_RECEIVED: "offers_received",
  OFFER_SELECTED: "offer_selected",
  EXPIRED: "expired",
  CLOSED: "closed",
  CANCELLED: "cancelled",
  DUPLICATE: "duplicate",
  RESUBMITTED: "resubmitted",
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];
export const requestStatuses = Object.values(RequestStatus);

export const RequestSource = {
  TELEGRAM_BOT: "telegram_bot",
  WEB_FORM: "web_form",
  ADMIN_MANUAL: "admin_manual",
  API: "api",
} as const;
export type RequestSource = (typeof RequestSource)[keyof typeof RequestSource];
export const requestSources = Object.values(RequestSource);

export const DeliveryPreference = {
  AIR: "air",
  SEA: "sea",
  RAIL: "rail",
  ROAD: "road",
  ANY: "any",
} as const;
export type DeliveryPreference =
  (typeof DeliveryPreference)[keyof typeof DeliveryPreference];
export const deliveryPreferences = Object.values(DeliveryPreference);

// Valid status transitions for requests
export const requestStatusTransitions: Record<RequestStatus, RequestStatus[]> = {
  new: ["matching", "cancelled", "duplicate"],
  matching: ["offers_received", "expired", "cancelled"],
  offers_received: ["offer_selected", "expired", "cancelled"],
  offer_selected: ["closed"],
  expired: ["resubmitted", "closed"],
  closed: [],
  cancelled: [],
  duplicate: [],
  resubmitted: [],
};

// ============================================
// Offer
// ============================================
export const OfferStatus = {
  ACTIVE: "active",
  SELECTED: "selected",
  REJECTED: "rejected",
  EXPIRED: "expired",
  HIDDEN: "hidden",
  SUSPICIOUS: "suspicious",
} as const;
export type OfferStatus = (typeof OfferStatus)[keyof typeof OfferStatus];
export const offerStatuses = Object.values(OfferStatus);

// ============================================
// Order
// ============================================
export const OrderStatus = {
  PAYMENT_PENDING: "payment_pending",
  CONFIRMED: "confirmed",
  AWAITING_SHIPMENT: "awaiting_shipment",
  IN_TRANSIT: "in_transit",
  CUSTOMS: "customs",
  CUSTOMS_HOLD: "customs_hold",
  DELIVERED: "delivered",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  DISPUTE: "dispute",
  ON_HOLD: "on_hold",
  PARTIALLY_DELIVERED: "partially_delivered",
  RETURN: "return",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
export const orderStatuses = Object.values(OrderStatus);

// Valid status transitions for orders
export const orderStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  payment_pending: ["confirmed", "cancelled"],
  confirmed: ["awaiting_shipment", "cancelled"],
  awaiting_shipment: ["in_transit", "cancelled", "on_hold"],
  in_transit: ["customs", "delivered", "on_hold"],
  customs: ["customs_hold", "in_transit", "delivered"],
  customs_hold: ["customs", "cancelled", "on_hold"],
  delivered: ["completed", "dispute", "partially_delivered", "return"],
  completed: [],
  cancelled: [],
  dispute: ["completed", "return", "cancelled"],
  on_hold: [
    "payment_pending",
    "confirmed",
    "awaiting_shipment",
    "in_transit",
    "customs",
    "customs_hold",
  ],
  partially_delivered: ["completed", "dispute", "return"],
  return: ["completed", "cancelled"],
};

// ============================================
// Order Document
// ============================================
export const DocumentType = {
  INVOICE: "invoice",
  CUSTOMS_DECLARATION: "customs_declaration",
  BILL_OF_LADING: "bill_of_lading",
  PHOTO: "photo",
  CONTRACT: "contract",
  OTHER: "other",
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];
export const documentTypes = Object.values(DocumentType);

// ============================================
// Order Status Change Source
// ============================================
export const ChangeSource = {
  ADMIN: "admin",
  SYSTEM: "system",
  CARRIER: "carrier",
  CUSTOMER: "customer",
  WEBHOOK: "webhook",
} as const;
export type ChangeSource = (typeof ChangeSource)[keyof typeof ChangeSource];
export const changeSources = Object.values(ChangeSource);

// ============================================
// Admin
// ============================================
export const AdminRole = {
  SUPER_ADMIN: "super_admin",
  OPERATOR: "operator",
  ANALYST: "analyst",
  CONTENT_MANAGER: "content_manager",
} as const;
export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole];
export const adminRoles = Object.values(AdminRole);

export const AdminStatus = {
  ACTIVE: "active",
  DISABLED: "disabled",
} as const;
export type AdminStatus = (typeof AdminStatus)[keyof typeof AdminStatus];
export const adminStatuses = Object.values(AdminStatus);

// ============================================
// Internal Comment
// ============================================
export const CommentEntityType = {
  REQUEST: "request",
  OFFER: "offer",
  ORDER: "order",
  CARRIER: "carrier",
  CUSTOMER: "customer",
} as const;
export type CommentEntityType =
  (typeof CommentEntityType)[keyof typeof CommentEntityType];
export const commentEntityTypes = Object.values(CommentEntityType);

// ============================================
// Notification
// ============================================
export const RecipientType = {
  CARRIER: "carrier",
  CUSTOMER: "customer",
  ADMIN: "admin",
} as const;
export type RecipientType = (typeof RecipientType)[keyof typeof RecipientType];

export const NotificationChannel = {
  TELEGRAM: "telegram",
  EMAIL: "email",
  SMS: "sms",
  IN_APP: "in_app",
} as const;
export type NotificationChannel =
  (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const NotificationStatus = {
  PENDING: "pending",
  SENT: "sent",
  DELIVERED: "delivered",
  FAILED: "failed",
} as const;
export type NotificationStatus =
  (typeof NotificationStatus)[keyof typeof NotificationStatus];

// ============================================
// SLA
// ============================================
export const SlaSeverity = {
  WARNING: "warning",
  CRITICAL: "critical",
} as const;
export type SlaSeverity = (typeof SlaSeverity)[keyof typeof SlaSeverity];
export const slaSeverities = Object.values(SlaSeverity);
