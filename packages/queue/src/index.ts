/**
 * BullMQ Queue Configuration
 *
 * Queues defined per specification:
 * - sla-checker: Runs every 5 minutes to check SLA violations
 * - request-expiry: Runs every 15 minutes to close expired requests
 * - offer-expiry: Runs every 15 minutes to expire offers past valid_until
 * - notifications: Real-time, processes notification sending (Telegram, email)
 * - reminders: Scheduled, sends reminders to carriers before deadlines
 * - stats-aggregation: Runs hourly to recalculate aggregated metrics
 * - analytics-export: On-demand, generates export files
 * - carrier-scoring: Nightly, recalculates SLA ratings for all carriers
 */

export const QUEUE_NAMES = {
  SLA_CHECKER: "sla-checker",
  REQUEST_EXPIRY: "request-expiry",
  OFFER_EXPIRY: "offer-expiry",
  NOTIFICATIONS: "notifications",
  REMINDERS: "reminders",
  STATS_AGGREGATION: "stats-aggregation",
  ANALYTICS_EXPORT: "analytics-export",
  CARRIER_SCORING: "carrier-scoring",
} as const;

export const QUEUE_SCHEDULES = {
  [QUEUE_NAMES.SLA_CHECKER]: "*/5 * * * *", // every 5 min
  [QUEUE_NAMES.REQUEST_EXPIRY]: "*/15 * * * *", // every 15 min
  [QUEUE_NAMES.OFFER_EXPIRY]: "*/15 * * * *", // every 15 min
  [QUEUE_NAMES.STATS_AGGREGATION]: "0 * * * *", // every hour
  [QUEUE_NAMES.CARRIER_SCORING]: "0 3 * * *", // daily at 3 AM
} as const;

// Queue job types
export type SlaCheckerJob = {
  type: "check_sla";
};

export type RequestExpiryJob = {
  type: "expire_requests";
};

export type OfferExpiryJob = {
  type: "expire_offers";
};

export type NotificationJob = {
  type: "send_notification";
  recipientType: "carrier" | "customer" | "admin";
  recipientId: string;
  channel: "telegram" | "email" | "sms" | "in_app";
  notificationType: string;
  payload: Record<string, unknown>;
};

export type ReminderJob = {
  type: "send_reminder";
  carrierId: string;
  requestId: string;
};

export type CarrierScoringJob = {
  type: "score_carriers";
};

export type AnalyticsExportJob = {
  type: "export_analytics";
  report: string;
  format: "csv" | "xlsx" | "pdf";
  dateFrom: string;
  dateTo: string;
  requestedBy: string;
};
