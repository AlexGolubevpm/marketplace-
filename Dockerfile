# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy dependency files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY packages/api/package.json ./packages/api/
COPY packages/queue/package.json ./packages/queue/
COPY apps/bot/package.json ./apps/bot/

RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Build application
# ============================================
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules

COPY . .

# Build the Next.js app (standalone output)
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @cargo/web build

# ============================================
# Stage 3: Production runner
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
