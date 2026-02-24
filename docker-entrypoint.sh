#!/bin/sh
set -e

echo "========================================"
echo "  Cargo Marketplace — Starting up"
echo "========================================"

# ── Diagnostic info ──
echo "==> Node.js: $(node --version)"
echo "==> User: $(whoami), CWD: $(pwd)"

# ── Helper: find a binary in multiple locations ──
find_bin() {
  for candidate in "$@"; do
    if [ -f "$candidate" ]; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

# ── Fix volume permissions (runs as root) ──
UPLOADS_DIR="/app/apps/web/public/uploads"
if [ "$(id -u)" = "0" ]; then
  echo "==> Fixing volume permissions..."
  mkdir -p "$UPLOADS_DIR"
  chown -R nextjs:nodejs "$UPLOADS_DIR"
  chown -R nextjs:nodejs /app/packages/db
  echo "==> Permissions fixed."
fi

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

# Use drizzle-kit from isolated /drizzle-tools install (has postgres driver included)
DRIZZLE_BIN="/drizzle-tools/node_modules/drizzle-kit/bin.cjs"

if [ -f "$DRIZZLE_BIN" ]; then
  echo "    Using drizzle-kit: $DRIZZLE_BIN"
  # Ensure drizzle-kit can find the postgres driver from /drizzle-tools
  export NODE_PATH="/drizzle-tools/node_modules:${NODE_PATH:-}"
  MAX_RETRIES=5
  RETRY=0
  until node "$DRIZZLE_BIN" push --force 2>&1; do
    RETRY=$((RETRY + 1))
    if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
      echo "WARNING: drizzle-kit push failed after ${MAX_RETRIES} attempts."
      echo "  The app will start anyway — schema may already be up to date."
      break
    fi
    echo "    Retrying drizzle-kit push... (attempt ${RETRY}/${MAX_RETRIES})"
    sleep 3
  done
  # Unset NODE_PATH so it doesn't affect Next.js runtime
  unset NODE_PATH
  echo "==> Database schema push complete."
else
  echo "WARNING: drizzle-kit not found — skipping schema push."
  echo "  Searched: /drizzle-tools/node_modules/drizzle-kit/bin.cjs"
fi

# ── Verify uploads directory is writable ──
if [ -w "$UPLOADS_DIR" ]; then
  echo "==> Uploads directory OK: $UPLOADS_DIR"
else
  echo "==> WARNING: Uploads directory is NOT writable: $UPLOADS_DIR"
  echo "    Images may fail to upload!"
fi

# ── Start Next.js (standalone mode) ──
cd /app

# Standalone server is at apps/web/server.js
STANDALONE_SERVER="/app/apps/web/server.js"

if [ -f "$STANDALONE_SERVER" ]; then
  echo "==> Starting Next.js standalone server on port ${PORT:-3000}..."
  # Drop privileges to nextjs user if running as root
  if [ "$(id -u)" = "0" ]; then
    exec su-exec nextjs:nodejs node "$STANDALONE_SERVER"
  else
    exec node "$STANDALONE_SERVER"
  fi
else
  echo "==> Standalone server.js not found, falling back to next start..."
  cd /app/apps/web
  NEXT_BIN=$(find_bin \
    "./node_modules/next/dist/bin/next" \
    "/app/node_modules/next/dist/bin/next" \
    "./node_modules/.bin/next" \
    "/app/node_modules/.bin/next" \
  ) || true

  if [ -z "$NEXT_BIN" ]; then
    echo "FATAL: Cannot find next binary!"
    exit 1
  fi

  echo "==> Starting Next.js on port ${PORT:-3000}..."
  # Drop privileges to nextjs user if running as root
  if [ "$(id -u)" = "0" ]; then
    exec su-exec nextjs:nodejs node "$NEXT_BIN" start -H 0.0.0.0 -p ${PORT:-3000}
  else
    exec node "$NEXT_BIN" start -H 0.0.0.0 -p ${PORT:-3000}
  fi
fi
