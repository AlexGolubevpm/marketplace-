import { z } from "zod";
import { eq, and, sql, desc, asc, gte, lte, inArray } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { orders, orderStatusHistory, orderDocuments, internalComments, customers } from "@cargo/db";
import {
  orderUpdateStatusSchema,
  orderFiltersSchema,
  paginationSchema,
  sortSchema,
  internalCommentCreateSchema,
} from "@cargo/shared";

export const ordersRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        pagination: paginationSchema.optional(),
        filters: orderFiltersSchema.optional(),
        sort: sortSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { pagination = { page: 1, pageSize: 20 }, filters, sort } = input;
      const conditions = [];

      if (filters?.status && filters.status.length > 0) {
        conditions.push(inArray(orders.status, filters.status as any));
      }
      if (filters?.carrierId) {
        conditions.push(eq(orders.carrier_id, filters.carrierId));
      }
      if (filters?.customerId) {
        conditions.push(eq(orders.customer_id, filters.customerId));
      }
      if (filters?.dateFrom) {
        conditions.push(gte(orders.created_at, new Date(filters.dateFrom)));
      }
      if (filters?.dateTo) {
        conditions.push(lte(orders.created_at, new Date(filters.dateTo)));
      }
      if (filters?.hasTracking === "yes") {
        conditions.push(sql`${orders.tracking_number} IS NOT NULL`);
      } else if (filters?.hasTracking === "no") {
        conditions.push(sql`${orders.tracking_number} IS NULL`);
      }
      if (filters?.search) {
        conditions.push(
          sql`(${orders.display_id} ILIKE ${"%" + filters.search + "%"} OR ${orders.tracking_number} ILIKE ${"%" + filters.search + "%"})`
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [data, countResult] = await Promise.all([
        ctx.db
          .select()
          .from(orders)
          .where(where)
          .orderBy(
            sort?.direction === "asc"
              ? asc(orders.created_at)
              : desc(orders.created_at)
          )
          .limit(pagination.pageSize)
          .offset((pagination.page - 1) * pagination.pageSize),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(orders)
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
      const [order] = await ctx.db
        .select()
        .from(orders)
        .where(eq(orders.id, input.id))
        .limit(1);

      if (!order) throw new Error("Order not found");

      const [history, documents, comments] = await Promise.all([
        ctx.db
          .select()
          .from(orderStatusHistory)
          .where(eq(orderStatusHistory.order_id, input.id))
          .orderBy(desc(orderStatusHistory.created_at)),
        ctx.db
          .select()
          .from(orderDocuments)
          .where(eq(orderDocuments.order_id, input.id))
          .orderBy(desc(orderDocuments.created_at)),
        ctx.db
          .select()
          .from(internalComments)
          .where(
            and(
              eq(internalComments.entity_type, "order"),
              eq(internalComments.entity_id, input.id)
            )
          )
          .orderBy(desc(internalComments.created_at)),
      ]);

      return { ...order, history, documents, comments };
    }),

  updateStatus: protectedProcedure
    .input(orderUpdateStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const [currentOrder] = await ctx.db
        .select()
        .from(orders)
        .where(eq(orders.id, input.id))
        .limit(1);

      if (!currentOrder) throw new Error("Order not found");

      const [updatedOrder] = await ctx.db
        .update(orders)
        .set({
          status: input.status as any,
          updated_at: new Date(),
          completed_at: input.status === "completed" ? new Date() : currentOrder.completed_at,
        })
        .where(eq(orders.id, input.id))
        .returning();

      // Record status history
      await ctx.db.insert(orderStatusHistory).values({
        order_id: input.id,
        from_status: currentOrder.status,
        to_status: input.status as any,
        changed_by: ctx.admin?.id,
        change_source: "admin" as any,
        comment: input.comment,
      });

      // Notify customer about order status change
      if (ctx.notify) {
        try {
          const [customer] = await ctx.db
            .select()
            .from(customers)
            .where(eq(customers.id, currentOrder.customer_id))
            .limit(1);

          if (customer?.telegram_id) {
            ctx.notify("order_status_changed", {
              customerTelegramId: customer.telegram_id,
              orderDisplayId: updatedOrder.display_id,
              oldStatus: currentOrder.status,
              newStatus: input.status,
              comment: input.comment,
            }).catch(() => {});
          }
        } catch (e) {
          console.error("[orders.updateStatus] Notification error:", e);
        }
      }

      return updatedOrder;
    }),

  addComment: protectedProcedure
    .input(z.object({ id: z.string().uuid(), text: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [comment] = await ctx.db
        .insert(internalComments)
        .values({
          entity_type: "order",
          entity_id: input.id,
          author_id: ctx.admin!.id,
          text: input.text,
        })
        .returning();
      return comment;
    }),

  getHistory: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(orderStatusHistory)
        .where(eq(orderStatusHistory.order_id, input.id))
        .orderBy(desc(orderStatusHistory.created_at));
    }),
});
