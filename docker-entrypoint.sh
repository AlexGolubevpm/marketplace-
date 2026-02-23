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

# Find drizzle-kit binary (bin.cjs is the actual JS entry point)
DRIZZLE_BIN=$(find_bin \
  "./node_modules/drizzle-kit/bin.cjs" \
  "/app/node_modules/drizzle-kit/bin.cjs" \
  "./node_modules/.bin/drizzle-kit" \
  "/app/node_modules/.bin/drizzle-kit" \
) || true

if [ -n "$DRIZZLE_BIN" ]; then
  echo "    Using drizzle-kit: $DRIZZLE_BIN"
  MAX_RETRIES=5
  RETRY=0
  until node "$DRIZZLE_BIN" push 2>&1; do
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
else
  echo "WARNING: drizzle-kit not found — skipping schema push."
  echo "  Searched: ./node_modules/drizzle-kit/bin.cjs"
  echo "  Searched: /app/node_modules/drizzle-kit/bin.cjs"
fi

# ── Start Next.js ──
cd /app/apps/web

# Find next binary (dist/bin/next is the actual JS entry point)
NEXT_BIN=$(find_bin \
  "./node_modules/next/dist/bin/next" \
  "/app/node_modules/next/dist/bin/next" \
  "./node_modules/.bin/next" \
  "/app/node_modules/.bin/next" \
) || true

# Diagnostics
echo "==> Next.js binary: ${NEXT_BIN:-NOT FOUND}"
if [ -f ".next/BUILD_ID" ]; then
  echo "==> Build ID: $(cat .next/BUILD_ID)"
else
  echo "==> WARNING: .next/BUILD_ID not found — build may be missing!"
  ls -la .next/ 2>/dev/null || echo "    .next/ directory does not exist!"
fi

if [ -z "$NEXT_BIN" ]; then
  echo "FATAL: Cannot find next binary!"
  echo "  Contents of ./node_modules/.bin/ (first 10):"
  ls ./node_modules/.bin/ 2>/dev/null | head -10 || echo "    (directory not found)"
  echo "  Contents of /app/node_modules/.bin/ (first 10):"
  ls /app/node_modules/.bin/ 2>/dev/null | head -10 || echo "    (directory not found)"
  echo "  Looking for next package:"
  ls -d ./node_modules/next 2>/dev/null || echo "    ./node_modules/next — not found"
  ls -d /app/node_modules/next 2>/dev/null || echo "    /app/node_modules/next — not found"
  exit 1
fi

echo "==> Starting Next.js on port ${PORT:-3000}..."
exec node "$NEXT_BIN" start -H 0.0.0.0 -p ${PORT:-3000}
