import { z } from "zod";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { carriers, carrierRegions, carrierDeliveryTypes } from "@cargo/db";
import {
  carrierCreateSchema,
  carrierUpdateSchema,
  carrierFiltersSchema,
  carrierRegionSchema,
  carrierDeliveryTypeSchema,
  paginationSchema,
  sortSchema,
} from "@cargo/shared";

export const carriersRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        pagination: paginationSchema.optional(),
        filters: carrierFiltersSchema.optional(),
        sort: sortSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { pagination = { page: 1, pageSize: 20 }, filters, sort } = input;
      const conditions = [];

      if (filters?.status) {
        conditions.push(eq(carriers.status, filters.status as any));
      }
      if (filters?.search) {
        conditions.push(
          sql`(${carriers.name} ILIKE ${"%" + filters.search + "%"} OR ${carriers.contact_name} ILIKE ${"%" + filters.search + "%"})`
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [data, countResult] = await Promise.all([
        ctx.db
          .select()
          .from(carriers)
          .where(where)
          .orderBy(
            sort?.direction === "asc"
              ? asc(carriers.created_at)
              : desc(carriers.created_at)
          )
          .limit(pagination.pageSize)
          .offset((pagination.page - 1) * pagination.pageSize),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(carriers)
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
      const [carrier] = await ctx.db
        .select()
        .from(carriers)
        .where(eq(carriers.id, input.id))
        .limit(1);

      if (!carrier) throw new Error("Carrier not found");

      const [regions, deliveryTypesData] = await Promise.all([
        ctx.db
          .select()
          .from(carrierRegions)
          .where(eq(carrierRegions.carrier_id, input.id)),
        ctx.db
          .select()
          .from(carrierDeliveryTypes)
          .where(eq(carrierDeliveryTypes.carrier_id, input.id)),
      ]);

      return { ...carrier, regions, deliveryTypes: deliveryTypesData };
    }),

  create: protectedProcedure
    .input(
      carrierCreateSchema.extend({
        regions: z.array(carrierRegionSchema).optional(),
        deliveryTypes: z.array(carrierDeliveryTypeSchema).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { regions, deliveryTypes, ...carrierData } = input;

      const [carrier] = await ctx.db
        .insert(carriers)
        .values(carrierData as any)
        .returning();

      if (regions && regions.length > 0) {
        await ctx.db.insert(carrierRegions).values(
          regions.map((r) => ({ ...r, carrier_id: carrier.id }))
        );
      }

      if (deliveryTypes && deliveryTypes.length > 0) {
        await ctx.db.insert(carrierDeliveryTypes).values(
          deliveryTypes.map((d) => ({ ...d, carrier_id: carrier.id })) as any
        );
      }

      return carrier;
    }),

  update: protectedProcedure
    .input(carrierUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [carrier] = await ctx.db
        .update(carriers)
        .set({ ...data, updated_at: new Date() } as any)
        .where(eq(carriers.id, id))
        .returning();
      return carrier;
    }),

  suspend: protectedProcedure
    .input(z.object({ id: z.string().uuid(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [carrier] = await ctx.db
        .update(carriers)
        .set({ status: "suspended" as any, updated_at: new Date() })
        .where(eq(carriers.id, input.id))
        .returning();
      return carrier;
    }),

  activate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [carrier] = await ctx.db
        .update(carriers)
        .set({ status: "active" as any, updated_at: new Date() })
        .where(eq(carriers.id, input.id))
        .returning();
      return carrier;
    }),

  block: protectedProcedure
    .input(z.object({ id: z.string().uuid(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [carrier] = await ctx.db
        .update(carriers)
        .set({ status: "blocked" as any, updated_at: new Date() })
        .where(eq(carriers.id, input.id))
        .returning();
      return carrier;
    }),

  updateRegions: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        regions: z.array(carrierRegionSchema),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(carrierRegions)
        .where(eq(carrierRegions.carrier_id, input.id));

      if (input.regions.length > 0) {
        await ctx.db.insert(carrierRegions).values(
          input.regions.map((r) => ({ ...r, carrier_id: input.id }))
        );
      }

      return ctx.db
        .select()
        .from(carrierRegions)
        .where(eq(carrierRegions.carrier_id, input.id));
    }),
});
