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
  const net = require('net');
  const url = new URL(process.env.DATABASE_URL);
  const sock = net.createConnection(parseInt(url.port) || 5432, url.hostname);
  sock.on('connect', () => { sock.destroy(); process.exit(0); });
  sock.on('error', () => { sock.destroy(); process.exit(1); });
  setTimeout(() => { sock.destroy(); process.exit(1); }, 3000);
"; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "ERROR: PostgreSQL not available after ${MAX_RETRIES} attempts. Exiting."
    exit 1
  fi
  echo "    Waiting for PostgreSQL... (attempt ${RETRY}/${MAX_RETRIES})"
  sleep 2
done
echo "==> PostgreSQL is ready."
sleep 1

# ── Push database schema ──
echo "==> Running database schema push..."
cd /app/packages/db

MAX_RETRIES=5
RETRY=0
until npx drizzle-kit push 2>&1; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "WARNING: drizzle-kit push failed after ${MAX_RETRIES} attempts."
    echo "  The app will start anyway — schema may already be up to date."
    break
  fi
  echo "    Retrying drizzle-kit push... (attempt ${RETRY}/${MAX_RETRIES})"
  sleep 3
done
echo "==> Database schema push complete."

# ── Start Next.js ──
cd /app/apps/web
echo "==> Starting Next.js on port ${PORT:-3000}..."
exec node_modules/.bin/next start -H 0.0.0.0 -p ${PORT:-3000}
