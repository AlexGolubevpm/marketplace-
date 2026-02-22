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
echo "[1/6] Pulling latest code..."
git pull origin main 2>/dev/null || true

# 2. Configure nginx
echo "[2/6] Configuring nginx..."
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

# 3. Build web + bot
echo "[3/6] Building application (this may take a few minutes)..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build web bot

# 4. Run DB migrations
echo "[4/6] Running database migrations..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres
sleep 3
# Push schema to DB (creates tables/indexes if missing)
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm web \
    sh -c 'cd /app && node -e "
const { execSync } = require(\"child_process\");
try { execSync(\"npx drizzle-kit push\", { stdio: \"inherit\", cwd: \"/app/packages/db\" }); }
catch(e) { console.log(\"DB push skipped (may already be up to date)\"); }
"' 2>/dev/null || echo "  DB migration skipped (will apply on next deploy)"

# 5. Start all services
echo "[5/6] Starting all services..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

# 6. Wait and check
echo "[6/6] Waiting for services..."
sleep 5

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
