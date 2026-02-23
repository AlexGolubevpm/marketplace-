#!/bin/bash
# ============================================
# Deploy / Update script
# Run from the project root directory
# ============================================
# Usage: cd ~/marketplace- && bash deploy/deploy.sh

set -e

# Determine project directory (where this script is run from)
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="docker-compose.prod.yml"

# Auto-detect env file: .env, .env.production, or .env.production.example
if [ -f "$APP_DIR/.env" ]; then
    ENV_FILE=".env"
elif [ -f "$APP_DIR/.env.production" ]; then
    ENV_FILE=".env.production"
else
    echo ""
    echo "No .env or .env.production found!"
    echo ""
    if [ -f "$APP_DIR/.env.production.example" ]; then
        echo "Creating .env from example..."
        cp "$APP_DIR/.env.production.example" "$APP_DIR/.env"
        echo ""
        echo "IMPORTANT: Edit the file with your settings:"
        echo "  nano $APP_DIR/.env"
        echo ""
        echo "Then run this script again:"
        echo "  bash deploy/deploy.sh"
    else
        echo "Create .env file with required variables first."
    fi
    exit 1
fi

echo "========================================="
echo "  Cargo Marketplace — Deploy"
echo "  Directory: $APP_DIR"
echo "  Env file:  $ENV_FILE"
echo "========================================="

cd "$APP_DIR"

# Load environment variables
set -a
source "$ENV_FILE"
set +a

# Auto-fill TG_AUTH_SECRET if not set
if [ -z "$TG_AUTH_SECRET" ] && [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    export TG_AUTH_SECRET="$TELEGRAM_BOT_TOKEN"
fi

# 1. Pull latest code
echo ""
echo "[1/5] Pulling latest code..."
git pull origin main 2>/dev/null || true

# 2. Configure nginx
echo "[2/5] Configuring nginx..."
if [ -f deploy/nginx-ssl.conf ] && [ -d /etc/letsencrypt/live/"$APP_DOMAIN" ]; then
    cp deploy/nginx-ssl.conf deploy/nginx.conf
    echo "  Using SSL config"
elif [ -f deploy/nginx-no-ssl.conf ]; then
    cp deploy/nginx-no-ssl.conf deploy/nginx.conf
    echo "  Using non-SSL config"
fi

if [ -f deploy/nginx.conf ]; then
    if [ -n "$APP_DOMAIN" ] && [ "$APP_DOMAIN" != "" ]; then
        sed -i "s/YOUR_DOMAIN.com/$APP_DOMAIN/g" deploy/nginx.conf
        echo "  Nginx configured for: $APP_DOMAIN"
    else
        sed -i "s/YOUR_DOMAIN.com/_/g" deploy/nginx.conf
        echo "  Nginx configured for IP access (no domain)"
    fi
fi

# 3. Ensure infrastructure is running (DB, Redis, MinIO)
echo "[3/5] Starting infrastructure services..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres redis minio
echo "  Waiting for PostgreSQL to be healthy..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --wait postgres

# 4. Build and deploy web + bot (with zero-downtime strategy)
echo "[4/5] Building and deploying application..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build web bot

# Start new containers (entrypoint handles DB migrations)
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d web bot

# 5. Restart nginx to pick up any upstream changes
echo "[5/5] Restarting nginx..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d nginx certbot
# Reload nginx config without dropping connections
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T nginx nginx -s reload 2>/dev/null || true

# Wait for web to become healthy
echo ""
echo "Waiting for web service to become healthy..."
RETRIES=0
MAX_WAIT=60
while [ $RETRIES -lt $MAX_WAIT ]; do
    if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps web | grep -q "(healthy)"; then
        break
    fi
    RETRIES=$((RETRIES + 1))
    sleep 1
done

echo ""
echo "========================================="
echo "  Service Status"
echo "========================================="
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
echo ""

# Check if web is running
if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps web | grep -q "Up"; then
    echo "SUCCESS: Application is running!"
    echo ""
    if [ -n "$APP_DOMAIN" ] && [ "$APP_DOMAIN" != "" ]; then
        echo "  Open: https://$APP_DOMAIN"
        echo "  Admin: https://$APP_DOMAIN/auth/admin"
    else
        IP=$(hostname -I | awk '{print $1}')
        echo "  Open: http://$IP:3000"
    fi
else
    echo "WARNING: Web container may not be ready yet."
    echo "Check logs: docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs web"
fi

echo ""
echo "Useful commands:"
echo "  docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f web    # app logs"
echo "  docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f bot    # bot logs"
echo "  docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f        # all logs"
echo "  docker compose -f $COMPOSE_FILE --env-file $ENV_FILE restart web    # restart app"
echo "  docker compose -f $COMPOSE_FILE --env-file $ENV_FILE down           # stop all"
echo ""
