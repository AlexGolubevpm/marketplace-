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
COPY --from=deps /app/packages/queue/node_modules ./packages/queue/node_modules

COPY . .

# Build the Next.js app (with output: "standalone" in next.config.js)
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
RUN pnpm --filter @cargo/web build

# Verify build output exists
RUN test -f /app/apps/web/.next/BUILD_ID && echo "Build OK: $(cat /app/apps/web/.next/BUILD_ID)" || (echo "FATAL: .next/BUILD_ID missing" && exit 1)
RUN test -d /app/apps/web/.next/standalone && echo "Standalone OK" || (echo "FATAL: standalone output missing" && exit 1)

# ============================================
# Stage 3: Production runner (minimal)
# ============================================
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat su-exec

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone server (includes only necessary node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Copy static assets and public files
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Copy db package schema for drizzle-kit push on startup
COPY --from=builder /app/packages/db ./packages/db

# Install drizzle-kit in an isolated directory so it doesn't corrupt standalone node_modules
RUN mkdir -p /drizzle-tools && cd /drizzle-tools && npm init -y && npm install drizzle-kit drizzle-orm postgres

# Copy entrypoint script and ensure it's executable
COPY --chmod=755 docker-entrypoint.sh /app/docker-entrypoint.sh

# Create uploads directory with correct ownership (for Docker volume mount)
RUN mkdir -p /app/apps/web/public/uploads && chown nextjs:nodejs /app/apps/web/public/uploads

# Set ownership for directories that entrypoint needs to write to
RUN chown -R nextjs:nodejs /app/packages/db

# NOTE: Entrypoint runs as root to fix volume permissions, then drops to nextjs via su-exec

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
