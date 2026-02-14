import { z } from "zod";
import {
  customerStatuses,
  carrierStatuses,
  deliveryTypes,
  cargoTypes,
  requestStatuses,
  requestSources,
  deliveryPreferences,
  offerStatuses,
  orderStatuses,
  documentTypes,
  changeSources,
  adminRoles,
  adminStatuses,
  commentEntityTypes,
  slaSeverities,
} from "./enums";

// ============================================
// Pagination & Filters
// ============================================
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const sortSchema = z.object({
  field: z.string(),
  direction: z.enum(["asc", "desc"]).default("desc"),
});

export const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

// ============================================
// Auth
// ============================================
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(8),
  newPassword: z.string().min(8).max(128),
});

// ============================================
// Customer
// ============================================
export const customerCreateSchema = z.object({
  telegram_id: z.string().min(1),
  telegram_username: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  full_name: z.string().optional(),
  company_name: z.string().optional(),
  status: z.enum(customerStatuses as [string, ...string[]]).default("active"),
  notes: z.string().optional(),
});

export const customerUpdateSchema = customerCreateSchema.partial().extend({
  id: z.string().uuid(),
});

export const customerFiltersSchema = z.object({
  status: z.enum(customerStatuses as [string, ...string[]]).optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// ============================================
// Carrier
// ============================================
export const carrierCreateSchema = z.object({
  name: z.string().min(1).max(255),
  contact_name: z.string().min(1).max(255),
  contact_phone: z.string().min(1).max(50),
  contact_email: z.string().email().optional(),
  telegram_id: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(carrierStatuses as [string, ...string[]]).default("active"),
});

export const carrierUpdateSchema = carrierCreateSchema.partial().extend({
  id: z.string().uuid(),
});

export const carrierFiltersSchema = z.object({
  status: z.enum(carrierStatuses as [string, ...string[]]).optional(),
  search: z.string().optional(),
  deliveryType: z.enum(deliveryTypes as [string, ...string[]]).optional(),
  region: z.string().optional(),
});

export const carrierRegionSchema = z.object({
  country_from: z.string().length(3),
  city_from: z.string().max(255).optional(),
  country_to: z.string().length(3),
  city_to: z.string().max(255).optional(),
});

export const carrierDeliveryTypeSchema = z.object({
  type: z.enum(deliveryTypes as [string, ...string[]]),
  max_weight_kg: z.number().positive().optional(),
  max_volume_m3: z.number().positive().optional(),
});

// ============================================
// Request
// ============================================
export const requestCreateSchema = z.object({
  customer_id: z.string().uuid(),
  origin_country: z.string().length(3),
  origin_city: z.string().min(1).max(255),
  destination_country: z.string().length(3),
  destination_city: z.string().min(1).max(255),
  cargo_description: z.string().min(1),
  weight_kg: z.number().positive().optional(),
  volume_m3: z.number().positive().optional(),
  cargo_type: z.enum(cargoTypes as [string, ...string[]]).optional(),
  delivery_type_preferred: z
    .enum(deliveryPreferences as [string, ...string[]])
    .optional(),
  budget_min: z.number().positive().optional(),
  budget_max: z.number().positive().optional(),
  desired_delivery_date: z.string().optional(),
  offer_deadline: z.string().datetime(),
  source: z.enum(requestSources as [string, ...string[]]).default("admin_manual"),
});

export const requestUpdateSchema = requestCreateSchema.partial().extend({
  id: z.string().uuid(),
});

export const requestFiltersSchema = z.object({
  status: z
    .array(z.enum(requestStatuses as [string, ...string[]]))
    .optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  originCountry: z.string().optional(),
  destinationCountry: z.string().optional(),
  hasOffers: z.enum(["yes", "no", "any"]).optional(),
  slaViolated: z.enum(["yes", "no", "any"]).optional(),
  customerId: z.string().uuid().optional(),
  source: z.enum(requestSources as [string, ...string[]]).optional(),
  managerId: z.string().uuid().optional(),
  search: z.string().optional(),
});

// ============================================
// Offer
// ============================================
export const offerCreateSchema = z.object({
  request_id: z.string().uuid(),
  carrier_id: z.string().uuid(),
  price: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  estimated_days: z.number().int().positive(),
  delivery_type: z.enum(deliveryTypes as [string, ...string[]]),
  conditions: z.string().optional(),
  valid_until: z.string().datetime().optional(),
});

export const offerUpdateSchema = z.object({
  id: z.string().uuid(),
  price: z.number().positive().optional(),
  estimated_days: z.number().int().positive().optional(),
  delivery_type: z.enum(deliveryTypes as [string, ...string[]]).optional(),
  conditions: z.string().optional(),
  valid_until: z.string().datetime().optional(),
});

export const offerFiltersSchema = z.object({
  status: z.enum(offerStatuses as [string, ...string[]]).optional(),
  requestId: z.string().uuid().optional(),
  carrierId: z.string().uuid().optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  suspicious: z.enum(["yes", "no", "any"]).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// ============================================
// Order
// ============================================
export const orderUpdateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(orderStatuses as [string, ...string[]]),
  comment: z.string().optional(),
});

export const orderFiltersSchema = z.object({
  status: z
    .array(z.enum(orderStatuses as [string, ...string[]]))
    .optional(),
  carrierId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  hasTracking: z.enum(["yes", "no", "any"]).optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  search: z.string().optional(),
});

// ============================================
// Internal Comment
// ============================================
export const internalCommentCreateSchema = z.object({
  entity_type: z.enum(commentEntityTypes as [string, ...string[]]),
  entity_id: z.string().uuid(),
  text: z.string().min(1),
});

// ============================================
// Admin
// ============================================
export const adminCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  full_name: z.string().min(1).max(255),
  role: z.enum(adminRoles as [string, ...string[]]),
});

export const adminUpdateSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1).max(255).optional(),
  role: z.enum(adminRoles as [string, ...string[]]).optional(),
  status: z.enum(adminStatuses as [string, ...string[]]).optional(),
});

// ============================================
// Landing Content
// ============================================
export const landingContentUpdateSchema = z.object({
  section: z.string().min(1).max(100),
  content: z.record(z.unknown()),
});

// ============================================
// SLA Config
// ============================================
export const slaConfigUpdateSchema = z.object({
  id: z.string().uuid(),
  threshold_value: z.number().positive().optional(),
  threshold_unit: z.string().optional(),
  severity: z.enum(slaSeverities as [string, ...string[]]).optional(),
  is_active: z.boolean().optional(),
});

// ============================================
// Analytics
// ============================================
export const analyticsQuerySchema = z.object({
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  carrierId: z.string().uuid().optional(),
});

export const dashboardQuerySchema = z.object({
  period: z.enum(["today", "7d", "30d", "90d", "year"]).default("today"),
});

// ============================================
// Audit Log
// ============================================
export const auditLogFiltersSchema = z.object({
  adminId: z.string().uuid().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// ============================================
// Type exports
// ============================================
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SortInput = z.infer<typeof sortSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CustomerCreate = z.infer<typeof customerCreateSchema>;
export type CustomerUpdate = z.infer<typeof customerUpdateSchema>;
export type CarrierCreate = z.infer<typeof carrierCreateSchema>;
export type CarrierUpdate = z.infer<typeof carrierUpdateSchema>;
export type CarrierRegionInput = z.infer<typeof carrierRegionSchema>;
export type RequestCreate = z.infer<typeof requestCreateSchema>;
export type RequestUpdate = z.infer<typeof requestUpdateSchema>;
export type OfferCreate = z.infer<typeof offerCreateSchema>;
export type OfferUpdate = z.infer<typeof offerUpdateSchema>;
export type OrderUpdateStatus = z.infer<typeof orderUpdateStatusSchema>;
export type InternalCommentCreate = z.infer<typeof internalCommentCreateSchema>;
export type AdminCreate = z.infer<typeof adminCreateSchema>;
export type AdminUpdate = z.infer<typeof adminUpdateSchema>;
export type LandingContentUpdate = z.infer<typeof landingContentUpdateSchema>;
export type SlaConfigUpdate = z.infer<typeof slaConfigUpdateSchema>;
