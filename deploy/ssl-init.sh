#!/bin/bash
# ============================================
# Initialize Let's Encrypt SSL certificates
# Run ONCE after deploy/deploy.sh
# ============================================
# Usage: bash deploy/ssl-init.sh your-domain.com your-email@example.com

set -e

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Usage: bash deploy/ssl-init.sh <domain> <email>"
    echo "Example: bash deploy/ssl-init.sh admin.cargo.com admin@cargo.com"
    exit 1
fi

APP_DIR="/opt/cargo-marketplace"
cd "$APP_DIR"

echo "========================================="
echo "  SSL Certificate Setup"
echo "  Domain: $DOMAIN"
echo "========================================="

# Create certbot directories
mkdir -p deploy/certbot/conf deploy/certbot/www

# Get certificate
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"

# Switch to SSL nginx config
echo "Switching to SSL config..."
cp deploy/nginx.conf.bak deploy/nginx.conf 2>/dev/null || cp deploy/nginx.conf deploy/nginx.conf
sed -i "s/YOUR_DOMAIN.com/$DOMAIN/g" deploy/nginx.conf

# Restart nginx
docker compose -f docker-compose.prod.yml restart nginx

echo ""
echo "SSL certificate installed!"
echo "Your site is now available at: https://$DOMAIN"
echo ""
echo "Certificates will auto-renew via certbot container."
