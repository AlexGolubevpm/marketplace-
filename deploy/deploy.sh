#!/bin/bash
# ============================================
# Deploy / Update script
# Run from the project root directory
# ============================================
# Usage: cd ~/cargo-marketplace && bash deploy/deploy.sh

set -e

# Determine project directory (where this script is run from)
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

echo "========================================="
echo "  Cargo Marketplace — Deploy"
echo "  Directory: $APP_DIR"
echo "========================================="

cd "$APP_DIR"

# Check .env.production exists
if [ ! -f "$ENV_FILE" ]; then
    echo ""
    echo "File $ENV_FILE not found!"
    echo ""
    echo "Creating from example..."
    cp .env.production.example .env.production
    echo ""
    echo "IMPORTANT: Edit the file with your settings:"
    echo "  nano $APP_DIR/.env.production"
    echo ""
    echo "Then run this script again:"
    echo "  bash deploy/deploy.sh"
    exit 1
fi

# Load environment variables
set -a
source "$ENV_FILE"
set +a

# 1. Pull latest code
echo "[1/5] Pulling latest code..."
git pull origin main 2>/dev/null || true

# 2. Configure nginx
echo "[2/5] Configuring nginx..."
cp deploy/nginx-no-ssl.conf deploy/nginx.conf
if [ -n "$APP_DOMAIN" ] && [ "$APP_DOMAIN" != "" ]; then
    sed -i "s/YOUR_DOMAIN.com/$APP_DOMAIN/g" deploy/nginx.conf
    echo "  Nginx configured for: $APP_DOMAIN"
else
    sed -i "s/YOUR_DOMAIN.com/_/g" deploy/nginx.conf
    echo "  Nginx configured for IP access (no domain)"
fi

# 3. Build
echo "[3/5] Building application (this may take a few minutes)..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build web

# 4. Start
echo "[4/5] Starting all services..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

# 5. Wait and check
echo "[5/5] Waiting for services..."
sleep 5

echo ""
echo "========================================="
echo "  Service Status"
echo "========================================="
docker compose -f "$COMPOSE_FILE" ps
echo ""

# Check if web is running
if docker compose -f "$COMPOSE_FILE" ps web | grep -q "Up"; then
    echo "SUCCESS: Application is running!"
    echo ""
    if [ -n "$APP_DOMAIN" ] && [ "$APP_DOMAIN" != "" ]; then
        echo "Open: http://$APP_DOMAIN"
    else
        IP=$(hostname -I | awk '{print $1}')
        echo "Open: http://$IP"
    fi
else
    echo "WARNING: Web container may not be ready yet."
    echo "Check logs: docker compose -f $COMPOSE_FILE logs web"
fi

echo ""
echo "Useful commands:"
echo "  docker compose -f $COMPOSE_FILE logs -f web    # app logs"
echo "  docker compose -f $COMPOSE_FILE logs -f        # all logs"
echo "  docker compose -f $COMPOSE_FILE restart web    # restart app"
echo "  docker compose -f $COMPOSE_FILE down           # stop all"
echo ""
