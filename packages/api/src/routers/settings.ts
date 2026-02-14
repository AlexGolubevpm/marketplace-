import { z } from "zod";
import { eq, and, sql, desc, asc, gte, lte } from "drizzle-orm";
import { router, protectedProcedure, withRole } from "../trpc";
import { admins, auditLogs, slaConfigs } from "@cargo/db";
import {
  adminCreateSchema,
  adminUpdateSchema,
  slaConfigUpdateSchema,
  auditLogFiltersSchema,
  paginationSchema,
} from "@cargo/shared";

export const settingsRouter = router({
  getSla: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(slaConfigs);
  }),

  updateSla: protectedProcedure
    .use(withRole("super_admin"))
    .input(slaConfigUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const filtered = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined)
      );
      const [config] = await ctx.db
        .update(slaConfigs)
        .set(filtered as any)
        .where(eq(slaConfigs.id, id))
        .returning();
      return config;
    }),

  getAuditLog: protectedProcedure
    .input(
      z.object({
        pagination: paginationSchema.optional(),
        filters: auditLogFiltersSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { pagination = { page: 1, pageSize: 20 }, filters } = input;
      const conditions = [];

      if (filters?.adminId) {
        conditions.push(eq(auditLogs.admin_id, filters.adminId));
      }
      if (filters?.action) {
        conditions.push(eq(auditLogs.action, filters.action));
      }
      if (filters?.entityType) {
        conditions.push(eq(auditLogs.entity_type, filters.entityType));
      }
      if (filters?.dateFrom) {
        conditions.push(gte(auditLogs.created_at, new Date(filters.dateFrom)));
      }
      if (filters?.dateTo) {
        conditions.push(lte(auditLogs.created_at, new Date(filters.dateTo)));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [data, countResult] = await Promise.all([
        ctx.db
          .select()
          .from(auditLogs)
          .where(where)
          .orderBy(desc(auditLogs.created_at))
          .limit(pagination.pageSize)
          .offset((pagination.page - 1) * pagination.pageSize),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(auditLogs)
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

  getAdmins: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: admins.id,
        email: admins.email,
        full_name: admins.full_name,
        role: admins.role,
        status: admins.status,
        last_login_at: admins.last_login_at,
        created_at: admins.created_at,
      })
      .from(admins)
      .orderBy(desc(admins.created_at));
  }),

  createAdmin: protectedProcedure
    .use(withRole("super_admin"))
    .input(adminCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // In production, hash password with bcrypt
      const [admin] = await ctx.db
        .insert(admins)
        .values({
          email: input.email,
          password_hash: input.password, // TODO: bcrypt hash
          full_name: input.full_name,
          role: input.role as any,
        })
        .returning({
          id: admins.id,
          email: admins.email,
          full_name: admins.full_name,
          role: admins.role,
          status: admins.status,
          created_at: admins.created_at,
        });
      return admin;
    }),

  updateAdmin: protectedProcedure
    .use(withRole("super_admin"))
    .input(adminUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const filtered = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined)
      );
      const [admin] = await ctx.db
        .update(admins)
        .set(filtered as any)
        .where(eq(admins.id, id))
        .returning({
          id: admins.id,
          email: admins.email,
          full_name: admins.full_name,
          role: admins.role,
          status: admins.status,
          created_at: admins.created_at,
        });
      return admin;
    }),

  disableAdmin: protectedProcedure
    .use(withRole("super_admin"))
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [admin] = await ctx.db
        .update(admins)
        .set({ status: "disabled" as any })
        .where(eq(admins.id, input.id))
        .returning({
          id: admins.id,
          email: admins.email,
          full_name: admins.full_name,
          role: admins.role,
          status: admins.status,
        });
      return admin;
    }),
});
