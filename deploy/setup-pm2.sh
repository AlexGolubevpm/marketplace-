#!/bin/bash
# ============================================
# Setup for PM2-based deploy (no Docker)
# For Timeweb VPS without Docker
# ============================================
# Usage: bash deploy/setup-pm2.sh

set -e

echo "========================================="
echo "  Cargo Marketplace — PM2 Setup"
echo "========================================="

# 1. Install Node.js 20 via NVM
echo "[1/6] Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    nvm install 20
    nvm use 20
    nvm alias default 20
fi
echo "Node.js: $(node -v)"

# 2. Install pnpm
echo "[2/6] Installing pnpm..."
npm install -g pnpm@9.15.0
echo "pnpm: $(pnpm -v)"

# 3. Install PM2
echo "[3/6] Installing PM2..."
npm install -g pm2
pm2 startup systemd -u $(whoami) --hp $HOME 2>/dev/null || true
echo "PM2 installed"

# 4. Install PostgreSQL
echo "[4/6] Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    apt-get update
    apt-get install -y postgresql postgresql-contrib
    systemctl enable postgresql
    systemctl start postgresql

    # Create database
    sudo -u postgres psql -c "CREATE DATABASE cargo_marketplace;" 2>/dev/null || true
    sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';" 2>/dev/null || true
    echo "PostgreSQL installed"
else
    echo "PostgreSQL already installed"
fi

# 5. Install Redis
echo "[5/6] Installing Redis..."
if ! command -v redis-server &> /dev/null; then
    apt-get install -y redis-server
    systemctl enable redis-server
    systemctl start redis-server
    echo "Redis installed"
else
    echo "Redis already installed"
fi

# 6. Install Nginx
echo "[6/6] Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx certbot python3-certbot-nginx
    systemctl enable nginx
    echo "Nginx installed"
else
    echo "Nginx already installed"
fi

# Create log directory
mkdir -p /var/log/cargo

echo ""
echo "========================================="
echo "  PM2 Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. cd /opt/cargo-marketplace"
echo "  2. cp .env.production.example apps/web/.env.local"
echo "  3. nano apps/web/.env.local  (edit settings, use localhost for DB)"
echo "  4. pnpm install"
echo "  5. pnpm build"
echo "  6. pm2 start ecosystem.config.js"
echo "  7. pm2 save"
echo ""
echo "For Nginx, copy the config:"
echo "  cp deploy/nginx-no-ssl.conf /etc/nginx/sites-available/cargo"
echo "  ln -s /etc/nginx/sites-available/cargo /etc/nginx/sites-enabled/"
echo "  # Edit: change 'web:3000' to 'localhost:3000' and set your domain"
echo "  nano /etc/nginx/sites-available/cargo"
echo "  nginx -t && systemctl reload nginx"
echo ""
echo "For SSL:"
echo "  certbot --nginx -d your-domain.com"
echo ""
