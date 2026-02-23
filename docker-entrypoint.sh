#!/bin/sh
set -e

echo "==> Running database schema push..."
cd /app/packages/db
npx drizzle-kit push --force
echo "==> Database schema push complete."

cd /app/apps/web
echo "==> Starting Next.js..."
exec npx next start -H 0.0.0.0 -p 3000
