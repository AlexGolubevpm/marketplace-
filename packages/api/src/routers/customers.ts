import { z } from "zod";
import { eq, ilike, and, sql, desc, asc } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { customers } from "@cargo/db";
import {
  customerCreateSchema,
  customerUpdateSchema,
  customerFiltersSchema,
  paginationSchema,
  sortSchema,
} from "@cargo/shared";

export const customersRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        pagination: paginationSchema.optional(),
        filters: customerFiltersSchema.optional(),
        sort: sortSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { pagination = { page: 1, pageSize: 20 }, filters, sort } = input;
      const conditions = [];

      if (filters?.status) {
        conditions.push(eq(customers.status, filters.status as any));
      }
      if (filters?.search) {
        conditions.push(
          sql`(${customers.full_name} ILIKE ${"%" + filters.search + "%"} OR ${customers.telegram_username} ILIKE ${"%" + filters.search + "%"} OR ${customers.telegram_id} ILIKE ${"%" + filters.search + "%"})`
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [data, countResult] = await Promise.all([
        ctx.db
          .select()
          .from(customers)
          .where(where)
          .orderBy(
            sort?.direction === "asc"
              ? asc(customers.created_at)
              : desc(customers.created_at)
          )
          .limit(pagination.pageSize)
          .offset((pagination.page - 1) * pagination.pageSize),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(customers)
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
      const result = await ctx.db
        .select()
        .from(customers)
        .where(eq(customers.id, input.id))
        .limit(1);

      if (!result[0]) {
        throw new Error("Customer not found");
      }
      return result[0];
    }),

  create: protectedProcedure
    .input(customerCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.insert(customers).values(input as any).returning();
      return result[0];
    }),

  update: protectedProcedure
    .input(customerUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const result = await ctx.db
        .update(customers)
        .set({ ...data, updated_at: new Date() } as any)
        .where(eq(customers.id, id))
        .returning();
      return result[0];
    }),

  ban: protectedProcedure
    .input(z.object({ id: z.string().uuid(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(customers)
        .set({ status: "banned" as any, updated_at: new Date() })
        .where(eq(customers.id, input.id))
        .returning();
      return result[0];
    }),

  unban: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(customers)
        .set({ status: "active" as any, updated_at: new Date() })
        .where(eq(customers.id, input.id))
        .returning();
      return result[0];
    }),
});
