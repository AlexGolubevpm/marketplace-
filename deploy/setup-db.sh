#!/bin/bash
# ============================================
# Setup PostgreSQL on Timeweb server
# ============================================
set -e

echo "========================================="
echo "  PostgreSQL Setup"
echo "========================================="

# Install PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "[1/4] Installing PostgreSQL..."
    apt-get update -qq
    apt-get install -y -qq postgresql postgresql-contrib
    systemctl enable postgresql
    systemctl start postgresql
    echo "PostgreSQL installed"
else
    echo "[1/4] PostgreSQL already installed"
    systemctl start postgresql 2>/dev/null || true
fi

# Generate a password
DB_PASSWORD=$(openssl rand -hex 16)
echo "[2/4] Setting up database..."

# Create database and user
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE cargo_marketplace;" 2>/dev/null || echo "Database already exists"

# Allow password auth
PG_HBA=$(sudo -u postgres psql -t -c "SHOW hba_file;" | xargs)
if ! grep -q "cargo_marketplace" "$PG_HBA" 2>/dev/null; then
    echo "local   cargo_marketplace   postgres   md5" >> "$PG_HBA"
    echo "host    cargo_marketplace   postgres   127.0.0.1/32   md5" >> "$PG_HBA"
    systemctl reload postgresql
fi

DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@localhost:5432/cargo_marketplace"

echo "[3/4] Database URL:"
echo "  $DATABASE_URL"
echo ""

# Push schema using Drizzle
echo "[4/4] Creating tables..."
cd /home/deploy/cargo-marketplace
DATABASE_URL="$DATABASE_URL" npx drizzle-kit push --config packages/db/drizzle.config.ts 2>/dev/null || echo "Drizzle push skipped (run manually if needed)"

echo ""
echo "========================================="
echo "  Done! Save this DATABASE_URL:"
echo "  $DATABASE_URL"
echo "========================================="
echo ""
echo "Add it to your environment:"
echo "  export DATABASE_URL=\"$DATABASE_URL\""
echo ""
echo "Or add to PM2 ecosystem config."
