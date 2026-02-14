#!/bin/bash
# ============================================
# Initial server setup script for Timeweb VPS
# Run this ONCE on a fresh server
# ============================================
# Usage: bash setup-server.sh

set -e

echo "========================================="
echo "  Cargo Marketplace — Server Setup"
echo "========================================="

# 1. Update system
echo "[1/6] Updating system packages..."
apt-get update && apt-get upgrade -y

# 2. Install Docker
echo "[2/6] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo "Docker installed successfully"
else
    echo "Docker already installed"
fi

# 3. Install Docker Compose
echo "[3/6] Installing Docker Compose..."
if ! command -v docker compose &> /dev/null; then
    apt-get install -y docker-compose-plugin
    echo "Docker Compose installed"
else
    echo "Docker Compose already installed"
fi

# 4. Install Git
echo "[4/6] Installing Git..."
apt-get install -y git
echo "Git installed"

# 5. Create app directory
echo "[5/6] Creating app directory..."
mkdir -p /opt/cargo-marketplace
cd /opt/cargo-marketplace

# 6. Clone repository
echo "[6/6] Cloning repository..."
if [ ! -d ".git" ]; then
    echo "Enter your GitHub repository URL:"
    echo "  Example: https://github.com/AlexGolubevpm/marketplace-.git"
    read -r REPO_URL
    git clone "$REPO_URL" .
else
    echo "Repository already cloned, pulling latest..."
    git pull
fi

echo ""
echo "========================================="
echo "  Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. cd /opt/cargo-marketplace"
echo "  2. cp .env.production.example .env.production"
echo "  3. nano .env.production  (edit your settings)"
echo "  4. bash deploy/deploy.sh"
echo ""
