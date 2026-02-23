import { z } from "zod";
import { eq, and, sql, desc, asc, gte, lte } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { offers, requests, customers, carriers } from "@cargo/db";
import {
  offerCreateSchema,
  offerUpdateSchema,
  offerFiltersSchema,
  paginationSchema,
  sortSchema,
} from "@cargo/shared";

function generateOfferDisplayId(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0");
  return `OFF-${year}-${num}`;
}

export const offersRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        pagination: paginationSchema.optional(),
        filters: offerFiltersSchema.optional(),
        sort: sortSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { pagination = { page: 1, pageSize: 20 }, filters, sort } = input;
      const conditions = [];

      if (filters?.status) {
        conditions.push(eq(offers.status, filters.status as any));
      }
      if (filters?.requestId) {
        conditions.push(eq(offers.request_id, filters.requestId));
      }
      if (filters?.carrierId) {
        conditions.push(eq(offers.carrier_id, filters.carrierId));
      }
      if (filters?.priceMin !== undefined) {
        conditions.push(gte(offers.price, String(filters.priceMin)));
      }
      if (filters?.priceMax !== undefined) {
        conditions.push(lte(offers.price, String(filters.priceMax)));
      }
      if (filters?.suspicious === "yes") {
        conditions.push(eq(offers.status, "suspicious" as any));
      }
      if (filters?.dateFrom) {
        conditions.push(gte(offers.created_at, new Date(filters.dateFrom)));
      }
      if (filters?.dateTo) {
        conditions.push(lte(offers.created_at, new Date(filters.dateTo)));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [data, countResult] = await Promise.all([
        ctx.db
          .select()
          .from(offers)
          .where(where)
          .orderBy(
            sort?.direction === "asc"
              ? asc(offers.created_at)
              : desc(offers.created_at)
          )
          .limit(pagination.pageSize)
          .offset((pagination.page - 1) * pagination.pageSize),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(offers)
          .where(where),
      ]);

      const total = countResult[0]?.count ?? 0;

      return {
        data,
        meta: {
          total,
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalPages: Math.ceil(total / pagination.pageSize),
        },
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [offer] = await ctx.db
        .select()
        .from(offers)
        .where(eq(offers.id, input.id))
        .limit(1);
      if (!offer) throw new Error("Offer not found");
      return offer;
    }),

  create: protectedProcedure
    .input(offerCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const display_id = generateOfferDisplayId();
      const [offer] = await ctx.db
        .insert(offers)
        .values({ ...input, display_id } as any)
        .returning();

      // Notify customer about new offer
      if (ctx.notify) {
        try {
          const [request] = await ctx.db
            .select()
            .from(requests)
            .where(eq(requests.id, offer.request_id))
            .limit(1);

          if (request) {
            const [customer] = await ctx.db
              .select()
              .from(customers)
              .where(eq(customers.id, request.customer_id))
              .limit(1);

            const [carrier] = await ctx.db
              .select()
              .from(carriers)
              .where(eq(carriers.id, offer.carrier_id))
              .limit(1);

            if (customer?.telegram_id) {
              ctx.notify("new_offer", {
                customerTelegramId: customer.telegram_id,
                requestDisplayId: request.display_id,
                offerPrice: offer.price,
                offerCurrency: offer.currency,
                estimatedDays: offer.estimated_days,
                carrierName: carrier?.name || "Карго-компания",
              }).catch(() => {});
            }
          }
        } catch (e) {
          console.error("[offers.create] Notification error:", e);
        }
      }

      return offer;
    }),

  update: protectedProcedure
    .input(offerUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [offer] = await ctx.db
        .update(offers)
        .set({ ...data, updated_at: new Date() } as any)
        .where(eq(offers.id, id))
        .returning();
      return offer;
    }),

  hide: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [offer] = await ctx.db
        .update(offers)
        .set({ status: "hidden" as any, updated_at: new Date() })
        .where(eq(offers.id, input.id))
        .returning();
      return offer;
    }),

  unhide: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [offer] = await ctx.db
        .update(offers)
        .set({ status: "active" as any, updated_at: new Date() })
        .where(eq(offers.id, input.id))
        .returning();
      return offer;
    }),

  markSuspicious: protectedProcedure
    .input(z.object({ id: z.string().uuid(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [offer] = await ctx.db
        .update(offers)
        .set({
          status: "suspicious" as any,
          suspicious_reason: input.reason,
          updated_at: new Date(),
        })
        .where(eq(offers.id, input.id))
        .returning();
      return offer;
    }),

  clearSuspicious: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [offer] = await ctx.db
        .update(offers)
        .set({
          status: "active" as any,
          suspicious_reason: null,
          updated_at: new Date(),
        })
        .where(eq(offers.id, input.id))
        .returning();
      return offer;
    }),
});
