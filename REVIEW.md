# Cargo Marketplace — System Review & Improvement Plan

## Architecture Overview

```
marketplace-/
├── apps/
│   ├── web/          Next.js 15 + React 19 (frontend + API routes)
│   └── bot/          Grammy Telegram bot (customer/carrier flows)
├── packages/
│   ├── api/          tRPC routers (business logic layer)
│   ├── db/           Drizzle ORM schemas + migrations
│   ├── queue/        Job queue (BullMQ/Redis)
│   └── shared/       Shared types, Zod schemas
├── deploy/           Nginx configs, deployment scripts
└── docker-compose.prod.yml
```

**Tech stack:** Next.js 15, React 19, tRPC 11, Drizzle ORM, PostgreSQL 16, Redis 7, MinIO, Tailwind CSS, Grammy

---

## 1. CRITICAL ISSUES (fix immediately)

### 1.1 Carrier Profile Not Functional (`/s/profile/page.tsx`)
- **Problem:** All data hardcoded (fake stats: 45 min response, 62 offers selected)
- **No API calls** — save button does nothing
- **Fix:** Connect to `/api/carriers` GET/PATCH, load real carrier data from session

### 1.2 Customer Profile Save Not Working (`/c/profile/page.tsx`)
- **Problem:** Save button has no `onSubmit` handler
- **Orders counter always 0** (not fetching from DB)
- **Fix:** Implement PATCH to `/api/customers`, count orders from `/api/orders`

### 1.3 Security: Admin Session in localStorage
- **Problem:** Admin session stored in localStorage without expiry, JWT signature only verified on tRPC calls
- **Risk:** XSS can steal admin session, no session timeout
- **Fix:** Use httpOnly cookies, add session expiry, implement refresh tokens

### 1.4 Security: No CSRF Protection on API Routes
- **Problem:** `/api/requests`, `/api/offers`, etc. accept POST/PATCH without CSRF tokens
- **Risk:** Cross-site request forgery attacks
- **Fix:** Add CSRF token middleware or use SameSite cookies

### 1.5 Security: Open PATCH/DELETE on `/api/carriers` and `/api/customers`
- **Problem:** No auth check — anyone can PATCH/DELETE carriers and customers
- **Fix:** Add admin session verification to all mutating REST API routes

---

## 2. HIGH PRIORITY (fix this sprint)

### 2.1 Performance: Polling Everywhere
- **Where:** `/c/requests` (5s), `/c/requests/[id]` (5s + SSE), `/s/requests` (5s), `/s/offers` (10s), chats (5-10s)
- **Problem:** Every open browser tab hammers the backend every 5 seconds
- **Fix:** Replace polling with WebSocket or SSE-only. Use `react-query` `staleTime` for caching

### 2.2 N+1 Query in Carrier Offers (`/s/offers/page.tsx`)
- **Problem:** Fetches request details separately for each offer
- **Fix:** Create a single API endpoint that returns offers with joined request data

### 2.3 Duplicate Data Layer
- **Problem:** Two parallel data layers:
  - REST API routes (`/api/requests`, `/api/offers`, etc.) — used by frontend pages
  - tRPC routers (`packages/api/src/routers/`) — used by admin panel via tRPC client
- **Duplication:** Same CRUD logic written twice with different validation
- **Fix:** Consolidate to tRPC only, use `createCallerFactory` for REST wrappers if needed

### 2.4 Two Knowledge Base Systems
- **Files:** `schema/knowledge.ts` (full system) + `schema/knowledgebase.ts` (simple system)
- **Problem:** Both define article/category tables with different structures
- **Fix:** Remove `knowledgebase.ts`, migrate existing data to `knowledge.ts`

### 2.5 Missing Error Handling
- **Where:** All `/c/` and `/s/` pages
- **Problem:** `try/catch` blocks log to console.error, no user-facing error messages
- **Fix:** Add toast notifications, error boundaries, retry logic

---

## 3. MEDIUM PRIORITY (next sprint)

### 3.1 Type Safety
- **Problem:** Excessive `any` casting in schema operations (`as any` in ~30 places)
- **Fix:** Use proper Drizzle enum types, remove `any` casts

### 3.2 Missing Pagination
- **Where:** All list pages load `LIMIT 100-200` without pagination UI
- **Fix:** Add pagination component, use `meta.totalPages` from tRPC responses

### 3.3 Missing Search & Filters
- **Where:** Carrier dashboard, customer dashboard — no search/filter UI
- **Admin:** Only requests page has search, offers/orders/carriers/customers don't
- **Fix:** Add search inputs and filter dropdowns to all list pages

### 3.4 No Input Validation on Frontend
- **Where:** All forms (create request, create offer, edit profile)
- **Problem:** No email format, phone format, price range validation
- **Fix:** Use `react-hook-form` + `zod` validation (already installed)

### 3.5 Missing Confirmation Dialogs
- **Where:** Cancel request, select offer, delete carrier/customer
- **Problem:** Destructive actions happen on single click
- **Fix:** Add confirmation modals before destructive operations

### 3.6 SSE + Polling Redundancy (`/c/requests/[id]`)
- **Problem:** Page uses both SSE subscription AND 5s polling for the same data
- **Fix:** Keep SSE only, remove polling

---

## 4. LOW PRIORITY (backlog)

### 4.1 Code Organization
- **Components:** Large pages (600+ lines) with mixed concerns
- **Fix:** Extract shared components: `OfferTable`, `OrderTimeline`, `DocumentUploader`, `StatusSelect`

### 4.2 Test Coverage
- **Current:** 65 tests covering auth, validation, router structure, knowledge base
- **Missing:** No frontend tests, no E2E tests, no API route tests
- **Fix:** Add Playwright E2E tests for critical flows (create request -> receive offer -> select -> order)

### 4.3 Real-time Notifications
- **Current:** No push notifications for new offers, order status changes
- **Fix:** Implement WebSocket notifications, integrate with Telegram bot for push

### 4.4 i18n Support
- **Current:** Hardcoded Russian strings throughout all pages
- **Fix:** Use `next-intl` or `i18next` for proper localization

### 4.5 Image/File Handling
- **Current:** MinIO configured but no image optimization, no file type validation
- **Fix:** Add file type/size validation, use Next.js `Image` component, implement thumbnails

### 4.6 Rate Limiting
- **Current:** Only knowledge search has rate limiting (30 req/window)
- **Fix:** Add rate limiting to all public API endpoints

### 4.7 Logging & Monitoring
- **Current:** `console.error` only
- **Fix:** Add structured logging (winston/pino), error tracking (Sentry), API metrics

---

## 5. DATABASE IMPROVEMENTS

### 5.1 Missing Indexes
- `requests.customer_id` — no index (slow customer request lookups)
- `offers.request_id` — no index (slow offer count aggregation)
- `orders.customer_id`, `orders.carrier_id` — no indexes
- **Fix:** Add composite indexes on frequently queried columns

### 5.2 Orphaned Migration Files
- `0002_bot_configs.sql` and `0003_bot_enhancements.sql` create tables that are now dropped by `0004_remove_bot_tables.sql`
- **Fix:** After confirming production migration works, these are fine to keep in history

### 5.3 No Soft Delete
- **Problem:** DELETE operations permanently remove records
- **Fix:** Add `deleted_at` column for soft delete on carriers, customers

---

## 6. DEPLOYMENT IMPROVEMENTS

### 6.1 No Health Check Endpoint
- **Fix:** Add `/api/health` that checks DB + Redis connectivity

### 6.2 No CI/CD Pipeline
- **Fix:** Add GitHub Actions for: lint, type-check, test, build, deploy

### 6.3 No Database Backups
- **Fix:** Add pg_dump cron job, store in S3/MinIO

### 6.4 Missing Environment Validation
- **Fix:** Use `zod` to validate all env vars at startup (fail fast)

---

## Summary Priority Matrix

| Priority | Count | Impact |
|----------|-------|--------|
| CRITICAL | 5 | Security vulnerabilities, broken features |
| HIGH     | 5 | Performance, data integrity, code duplication |
| MEDIUM   | 6 | UX, validation, missing features |
| LOW      | 7 | Code quality, testing, infrastructure |
| DB       | 3 | Query performance, data management |
| Deploy   | 4 | Reliability, CI/CD |
