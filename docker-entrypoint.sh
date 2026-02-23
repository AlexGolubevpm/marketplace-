#!/bin/sh
set -e

echo "========================================"
echo "  Cargo Marketplace — Starting up"
echo "========================================"

# ── Wait for PostgreSQL to accept connections ──
echo "==> Waiting for PostgreSQL..."
MAX_RETRIES=30
RETRY=0
until node -e "
  const pg = require('postgres');
  const sql = pg(process.env.DATABASE_URL);
  sql\`SELECT 1\`.then(() => { sql.end(); process.exit(0); })
    .catch(() => { sql.end(); process.exit(1); });
" 2>/dev/null; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "ERROR: PostgreSQL not available after ${MAX_RETRIES} attempts. Exiting."
    exit 1
  fi
  echo "    Waiting for PostgreSQL... (attempt ${RETRY}/${MAX_RETRIES})"
  sleep 2
done
echo "==> PostgreSQL is ready."

# ── Push database schema ──
echo "==> Running database schema push..."
cd /app/packages/db

MAX_RETRIES=3
RETRY=0
until npx drizzle-kit push --force; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "ERROR: drizzle-kit push failed after ${MAX_RETRIES} attempts. Exiting."
    exit 1
  fi
  echo "    Retrying drizzle-kit push... (attempt ${RETRY}/${MAX_RETRIES})"
  sleep 3
done
echo "==> Database schema push complete."

# ── Start Next.js ──
cd /app/apps/web
echo "==> Starting Next.js on port ${PORT:-3000}..."
exec npx next start -H 0.0.0.0 -p ${PORT:-3000}
