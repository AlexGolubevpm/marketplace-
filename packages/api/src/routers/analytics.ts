import { z } from "zod";
import { sql, gte, lte, and, eq } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { requests, offers, orders, carriers } from "@cargo/db";
import { dashboardQuerySchema, analyticsQuerySchema } from "@cargo/shared";

function getPeriodDates(period: string): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();

  switch (period) {
    case "today":
      from.setHours(0, 0, 0, 0);
      break;
    case "7d":
      from.setDate(from.getDate() - 7);
      break;
    case "30d":
      from.setDate(from.getDate() - 30);
      break;
    case "90d":
      from.setDate(from.getDate() - 90);
      break;
    case "year":
      from.setFullYear(from.getFullYear() - 1);
      break;
    default:
      from.setHours(0, 0, 0, 0);
  }

  return { from, to };
}

export const analyticsRouter = router({
  dashboard: protectedProcedure
    .input(dashboardQuerySchema)
    .query(async ({ ctx, input }) => {
      const { from, to } = getPeriodDates(input.period);
      const prevFrom = new Date(from.getTime() - (to.getTime() - from.getTime()));

      // Current period metrics
      const [
        newRequestsResult,
        offersResult,
        activeOrdersResult,
        slaViolationsResult,
        selectedOffersResult,
        totalRequestsResult,
      ] = await Promise.all([
        // New requests in period
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(requests)
          .where(and(gte(requests.created_at, from), lte(requests.created_at, to))),
        // Offers in period
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(offers)
          .where(and(gte(offers.created_at, from), lte(offers.created_at, to))),
        // Active orders
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(orders)
          .where(
            sql`${orders.status} NOT IN ('completed', 'cancelled')`
          ),
        // SLA violations in period
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(requests)
          .where(
            and(
              eq(requests.sla_violated, true),
              gte(requests.created_at, from),
              lte(requests.created_at, to)
            )
          ),
        // Selected offers (conversions)
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(offers)
          .where(
            and(
              eq(offers.status, "selected" as any),
              gte(offers.created_at, from),
              lte(offers.created_at, to)
            )
          ),
        // Total requests that have at least 1 offer
        ctx.db
          .select({ count: sql<number>`count(DISTINCT ${offers.request_id})::int` })
          .from(offers)
          .where(and(gte(offers.created_at, from), lte(offers.created_at, to))),
      ]);

      // Previous period for comparison
      const [prevRequestsResult] = await Promise.all([
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(requests)
          .where(
            and(gte(requests.created_at, prevFrom), lte(requests.created_at, from))
          ),
      ]);

      const newRequests = newRequestsResult[0]?.count ?? 0;
      const totalOffers = offersResult[0]?.count ?? 0;
      const activeOrders = activeOrdersResult[0]?.count ?? 0;
      const slaViolations = slaViolationsResult[0]?.count ?? 0;
      const selectedOffers = selectedOffersResult[0]?.count ?? 0;
      const requestsWithOffers = totalRequestsResult[0]?.count ?? 0;
      const prevRequests = prevRequestsResult[0]?.count ?? 0;

      const avgOffersPerRequest = newRequests > 0 ? totalOffers / newRequests : 0;
      const conversionRate =
        newRequests > 0 ? (selectedOffers / newRequests) * 100 : 0;

      return {
        newRequests: {
          value: newRequests,
          trend: prevRequests > 0 ? ((newRequests - prevRequests) / prevRequests) * 100 : 0,
        },
        avgFirstResponse: {
          value: 0, // Would need first_offer_at calculation
          trend: 0,
        },
        avgOffersPerRequest: {
          value: Math.round(avgOffersPerRequest * 10) / 10,
          trend: 0,
        },
        conversionRate: {
          value: Math.round(conversionRate * 10) / 10,
          trend: 0,
        },
        activeOrders: {
          value: activeOrders,
          trend: 0,
        },
        slaViolations: {
          value: slaViolations,
          trend: 0,
        },
      };
    }),

  funnel: protectedProcedure
    .input(analyticsQuerySchema)
    .query(async ({ ctx, input }) => {
      const from = new Date(input.dateFrom);
      const to = new Date(input.dateTo);
      const dateFilter = and(gte(requests.created_at, from), lte(requests.created_at, to));

      const [totalResult, withOffersResult, with3OffersResult, selectedResult, confirmedResult, completedResult] = await Promise.all([
        ctx.db.select({ count: sql<number>`count(*)::int` }).from(requests).where(dateFilter),
        ctx.db.select({ count: sql<number>`count(DISTINCT ${offers.request_id})::int` }).from(offers)
          .where(and(gte(offers.created_at, from), lte(offers.created_at, to))),
        ctx.db.select({ count: sql<number>`count(*)::int` }).from(
          ctx.db.select({ rid: offers.request_id }).from(offers)
            .where(and(gte(offers.created_at, from), lte(offers.created_at, to)))
            .groupBy(offers.request_id)
            .having(sql`count(*) >= 3`)
            .as("sub")
        ),
        ctx.db.select({ count: sql<number>`count(*)::int` }).from(requests)
          .where(and(dateFilter, eq(requests.status, "offer_selected" as any))),
        ctx.db.select({ count: sql<number>`count(*)::int` }).from(orders)
          .where(and(gte(orders.created_at, from), lte(orders.created_at, to), sql`${orders.status} != 'cancelled'`)),
        ctx.db.select({ count: sql<number>`count(*)::int` }).from(orders)
          .where(and(gte(orders.created_at, from), lte(orders.created_at, to), eq(orders.status, "completed" as any))),
      ]);

      const total = totalResult[0]?.count ?? 0;
      return {
        steps: [
          { label: "Заявка создана", count: total, percent: 100 },
          { label: "≥ 1 оффер", count: withOffersResult[0]?.count ?? 0, percent: total > 0 ? Math.round(((withOffersResult[0]?.count ?? 0) / total) * 100) : 0 },
          { label: "≥ 3 офферов", count: with3OffersResult[0]?.count ?? 0, percent: total > 0 ? Math.round(((with3OffersResult[0]?.count ?? 0) / total) * 100) : 0 },
          { label: "Оффер выбран", count: selectedResult[0]?.count ?? 0, percent: total > 0 ? Math.round(((selectedResult[0]?.count ?? 0) / total) * 100) : 0 },
          { label: "Заказ подтверждён", count: confirmedResult[0]?.count ?? 0, percent: total > 0 ? Math.round(((confirmedResult[0]?.count ?? 0) / total) * 100) : 0 },
          { label: "Доставка завершена", count: completedResult[0]?.count ?? 0, percent: total > 0 ? Math.round(((completedResult[0]?.count ?? 0) / total) * 100) : 0 },
        ],
      };
    }),

  financial: protectedProcedure
    .input(analyticsQuerySchema)
    .query(async ({ ctx, input }) => {
      const from = new Date(input.dateFrom);
      const to = new Date(input.dateTo);

      const [gmvResult, commissionResult, avgCheckResult] = await Promise.all([
        ctx.db
          .select({ total: sql<number>`COALESCE(sum(${orders.price}::numeric), 0)::float` })
          .from(orders)
          .where(and(gte(orders.created_at, from), lte(orders.created_at, to), sql`${orders.status} != 'cancelled'`)),
        ctx.db
          .select({ total: sql<number>`COALESCE(sum(${orders.commission_amount}::numeric), 0)::float` })
          .from(orders)
          .where(and(gte(orders.created_at, from), lte(orders.created_at, to), sql`${orders.status} != 'cancelled'`)),
        ctx.db
          .select({ avg: sql<number>`COALESCE(avg(${orders.price}::numeric), 0)::float` })
          .from(orders)
          .where(and(gte(orders.created_at, from), lte(orders.created_at, to), sql`${orders.status} != 'cancelled'`)),
      ]);

      return {
        gmv: gmvResult[0]?.total ?? 0,
        commission: commissionResult[0]?.total ?? 0,
        avgCheck: Math.round((avgCheckResult[0]?.avg ?? 0) * 100) / 100,
      };
    }),
});
