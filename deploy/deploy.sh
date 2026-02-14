#!/bin/bash
# ============================================
# Deploy / Update script
# Run this to deploy or update the application
# ============================================
# Usage: bash deploy/deploy.sh

set -e

APP_DIR="/opt/cargo-marketplace"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

echo "========================================="
echo "  Cargo Marketplace — Deploy"
echo "========================================="

cd "$APP_DIR"

# Check .env.production exists
if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: $ENV_FILE not found!"
    echo "Run: cp .env.production.example .env.production"
    echo "Then edit it with your settings."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' "$ENV_FILE" | xargs)

# 1. Pull latest code
echo "[1/5] Pulling latest code..."
git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || echo "Pull from current branch..."
git pull 2>/dev/null || true

# 2. Replace domain in nginx config
echo "[2/5] Configuring nginx..."
if [ -n "$APP_DOMAIN" ]; then
    # Use no-ssl config initially, switch to ssl config after certbot
    if [ -f "deploy/certbot/conf/live/$APP_DOMAIN/fullchain.pem" ]; then
        cp deploy/nginx.conf deploy/nginx-active.conf
    else
        cp deploy/nginx-no-ssl.conf deploy/nginx-active.conf
    fi
    sed -i "s/YOUR_DOMAIN.com/$APP_DOMAIN/g" deploy/nginx-active.conf
    # Use the active config
    cp deploy/nginx-active.conf deploy/nginx.conf.bak
    cp deploy/nginx-active.conf deploy/nginx.conf
    echo "Nginx configured for domain: $APP_DOMAIN"
else
    cp deploy/nginx-no-ssl.conf deploy/nginx.conf
    sed -i "s/YOUR_DOMAIN.com/_/g" deploy/nginx.conf
    echo "Nginx configured without domain (IP access)"
fi

# 3. Build and start containers
echo "[3/5] Building application..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache web

echo "[4/5] Starting services..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

# 5. Wait for services
echo "[5/5] Waiting for services to start..."
sleep 5

# Check health
echo ""
echo "Checking services..."
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "========================================="
echo "  Deploy Complete!"
echo "========================================="
echo ""
if [ -n "$APP_DOMAIN" ]; then
    echo "Your app is available at: https://$APP_DOMAIN"
else
    echo "Your app is available at: http://YOUR_SERVER_IP"
fi
echo ""
echo "Useful commands:"
echo "  docker compose -f $COMPOSE_FILE logs -f web    # view app logs"
echo "  docker compose -f $COMPOSE_FILE logs -f        # view all logs"
echo "  docker compose -f $COMPOSE_FILE restart web    # restart app"
echo "  docker compose -f $COMPOSE_FILE down           # stop all"
echo ""
