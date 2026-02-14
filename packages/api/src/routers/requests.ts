import { z } from "zod";
import { eq, and, sql, desc, asc, gte, lte, inArray } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { requests, requestCarrierMatches, offers, customers } from "@cargo/db";
import {
  requestCreateSchema,
  requestUpdateSchema,
  requestFiltersSchema,
  paginationSchema,
  sortSchema,
} from "@cargo/shared";

function generateDisplayId(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0");
  return `REQ-${year}-${num}`;
}

export const requestsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        pagination: paginationSchema.optional(),
        filters: requestFiltersSchema.optional(),
        sort: sortSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { pagination = { page: 1, pageSize: 20 }, filters, sort } = input;
      const conditions = [];

      if (filters?.status && filters.status.length > 0) {
        conditions.push(inArray(requests.status, filters.status as any));
      }
      if (filters?.originCountry) {
        conditions.push(eq(requests.origin_country, filters.originCountry));
      }
      if (filters?.destinationCountry) {
        conditions.push(eq(requests.destination_country, filters.destinationCountry));
      }
      if (filters?.customerId) {
        conditions.push(eq(requests.customer_id, filters.customerId));
      }
      if (filters?.source) {
        conditions.push(eq(requests.source, filters.source as any));
      }
      if (filters?.managerId) {
        conditions.push(eq(requests.assigned_manager_id, filters.managerId));
      }
      if (filters?.slaViolated === "yes") {
        conditions.push(eq(requests.sla_violated, true));
      } else if (filters?.slaViolated === "no") {
        conditions.push(eq(requests.sla_violated, false));
      }
      if (filters?.dateFrom) {
        conditions.push(gte(requests.created_at, new Date(filters.dateFrom)));
      }
      if (filters?.dateTo) {
        conditions.push(lte(requests.created_at, new Date(filters.dateTo)));
      }
      if (filters?.search) {
        conditions.push(
          sql`(${requests.display_id} ILIKE ${"%" + filters.search + "%"} OR ${requests.cargo_description} ILIKE ${"%" + filters.search + "%"})`
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const sortField = sort?.field === "weight" ? requests.weight_kg
        : sort?.field === "created_at" ? requests.created_at
        : requests.created_at;

      const [data, countResult] = await Promise.all([
        ctx.db
          .select()
          .from(requests)
          .where(where)
          .orderBy(sort?.direction === "asc" ? asc(sortField) : desc(sortField))
          .limit(pagination.pageSize)
          .offset((pagination.page - 1) * pagination.pageSize),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(requests)
          .where(where),
      ]);

      const total = countResult[0]?.count ?? 0;

      // Get offer counts for each request
      const requestIds = data.map((r) => r.id);
      let offerCounts: Record<string, number> = {};
      if (requestIds.length > 0) {
        const counts = await ctx.db
          .select({
            request_id: offers.request_id,
            count: sql<number>`count(*)::int`,
          })
          .from(offers)
          .where(inArray(offers.request_id, requestIds))
          .groupBy(offers.request_id);
        offerCounts = Object.fromEntries(counts.map((c) => [c.request_id, c.count]));
      }

      return {
        data: data.map((r) => ({
          ...r,
          offer_count: offerCounts[r.id] || 0,
        })),
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
      const [request] = await ctx.db
        .select()
        .from(requests)
        .where(eq(requests.id, input.id))
        .limit(1);

      if (!request) throw new Error("Request not found");

      const [requestOffers, matches, customer] = await Promise.all([
        ctx.db.select().from(offers).where(eq(offers.request_id, input.id)),
        ctx.db
          .select()
          .from(requestCarrierMatches)
          .where(eq(requestCarrierMatches.request_id, input.id)),
        ctx.db
          .select()
          .from(customers)
          .where(eq(customers.id, request.customer_id))
          .limit(1),
      ]);

      return {
        ...request,
        offers: requestOffers,
        matches,
        customer: customer[0] || null,
      };
    }),

  create: protectedProcedure
    .input(requestCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const display_id = generateDisplayId();
      const [request] = await ctx.db
        .insert(requests)
        .values({ ...input, display_id } as any)
        .returning();
      return request;
    }),

  update: protectedProcedure
    .input(requestUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [request] = await ctx.db
        .update(requests)
        .set({ ...data, updated_at: new Date() } as any)
        .where(eq(requests.id, id))
        .returning();
      return request;
    }),

  close: protectedProcedure
    .input(z.object({ id: z.string().uuid(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [request] = await ctx.db
        .update(requests)
        .set({
          status: "closed" as any,
          closed_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(requests.id, input.id))
        .returning();
      return request;
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [request] = await ctx.db
        .update(requests)
        .set({
          status: "cancelled" as any,
          closed_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(requests.id, input.id))
        .returning();
      return request;
    }),

  markDuplicate: protectedProcedure
    .input(z.object({ id: z.string().uuid(), originalId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [request] = await ctx.db
        .update(requests)
        .set({
          status: "duplicate" as any,
          parent_request_id: input.originalId,
          updated_at: new Date(),
        })
        .where(eq(requests.id, input.id))
        .returning();
      return request;
    }),

  extendDeadline: protectedProcedure
    .input(z.object({ id: z.string().uuid(), newDeadline: z.string().datetime() }))
    .mutation(async ({ ctx, input }) => {
      const [request] = await ctx.db
        .update(requests)
        .set({
          offer_deadline: new Date(input.newDeadline),
          updated_at: new Date(),
        })
        .where(eq(requests.id, input.id))
        .returning();
      return request;
    }),

  assignManager: protectedProcedure
    .input(z.object({ id: z.string().uuid(), managerId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [request] = await ctx.db
        .update(requests)
        .set({
          assigned_manager_id: input.managerId,
          updated_at: new Date(),
        })
        .where(eq(requests.id, input.id))
        .returning();
      return request;
    }),
});
