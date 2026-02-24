#!/bin/bash
# ============================================
# Check & stop host services that conflict
# with Docker Compose stack
# ============================================
# Usage: bash deploy/check-conflicts.sh [--auto-fix]
#
# Detects host-level PostgreSQL, Redis, Nginx
# that would conflict with Docker containers
# on the same ports.

set -e

AUTO_FIX=false
if [ "$1" = "--auto-fix" ]; then
    AUTO_FIX=true
fi

CONFLICTS_FOUND=false

# Services that Docker Compose manages — must not run on host
# Format: "service_name:port:description"
SERVICES=(
    "postgresql:5432:PostgreSQL database"
    "redis-server:6379:Redis cache"
    "redis:6379:Redis cache"
    "nginx:80:Nginx reverse proxy"
    "minio:9000:MinIO storage"
)

echo ""
echo "========================================="
echo "  Checking for host/Docker conflicts"
echo "========================================="
echo ""

# ------------------------------------------
# 1. Check host systemd services
# ------------------------------------------
check_systemd_service() {
    local service_name="$1"
    local description="$2"

    if systemctl is-active --quiet "$service_name" 2>/dev/null; then
        echo "  CONFLICT: $description ($service_name) is running on host via systemd"
        CONFLICTS_FOUND=true

        if [ "$AUTO_FIX" = true ]; then
            echo "  -> Stopping and disabling $service_name..."
            systemctl stop "$service_name" 2>/dev/null || true
            systemctl disable "$service_name" 2>/dev/null || true
            echo "  -> Done"
        fi
        return 0
    fi
    return 1
}

echo "[1/3] Checking systemd services..."

HOST_SERVICES=(
    "postgresql:PostgreSQL"
    "redis-server:Redis"
    "redis:Redis"
    "nginx:Nginx"
    "minio:MinIO"
)

FOUND_ANY=false
for entry in "${HOST_SERVICES[@]}"; do
    svc="${entry%%:*}"
    desc="${entry#*:}"
    if check_systemd_service "$svc" "$desc"; then
        FOUND_ANY=true
    fi
done

if [ "$FOUND_ANY" = false ]; then
    echo "  OK — no conflicting systemd services"
fi

# ------------------------------------------
# 2. Check for port conflicts
# ------------------------------------------
echo ""
echo "[2/3] Checking port conflicts..."

DOCKER_PORTS=(
    "5432:PostgreSQL"
    "6379:Redis"
    "80:HTTP/Nginx"
    "443:HTTPS/Nginx"
    "9000:MinIO API"
    "9001:MinIO Console"
    "3000:Next.js"
)

PORT_CONFLICT=false
for entry in "${DOCKER_PORTS[@]}"; do
    port="${entry%%:*}"
    desc="${entry#*:}"

    # Check if something non-Docker is listening on this port
    if command -v ss &>/dev/null; then
        PID_INFO=$(ss -tlnp "sport = :$port" 2>/dev/null | grep -v "^State" || true)
    elif command -v netstat &>/dev/null; then
        PID_INFO=$(netstat -tlnp 2>/dev/null | grep ":$port " || true)
    else
        PID_INFO=""
    fi

    if [ -n "$PID_INFO" ]; then
        # Skip if it's a Docker process
        if echo "$PID_INFO" | grep -q "docker\|containerd"; then
            continue
        fi
        echo "  CONFLICT: Port $port ($desc) is occupied by a non-Docker process"
        echo "            $PID_INFO"
        PORT_CONFLICT=true
        CONFLICTS_FOUND=true
    fi
done

if [ "$PORT_CONFLICT" = false ]; then
    echo "  OK — no port conflicts detected"
fi

# ------------------------------------------
# 3. Check for duplicate Docker Compose stacks
# ------------------------------------------
echo ""
echo "[3/3] Checking for duplicate Docker Compose stacks..."

if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
    # Find all postgres containers
    PG_CONTAINERS=$(docker ps --filter "ancestor=postgres:16-alpine" --format "{{.Names}}" 2>/dev/null || true)
    PG_COUNT=$(echo "$PG_CONTAINERS" | grep -c . 2>/dev/null || echo "0")

    if [ "$PG_COUNT" -gt 1 ]; then
        echo "  CONFLICT: $PG_COUNT PostgreSQL containers running:"
        echo "$PG_CONTAINERS" | sed 's/^/            /'
        CONFLICTS_FOUND=true

        if [ "$AUTO_FIX" = true ]; then
            echo ""
            echo "  -> Looking for stale Docker Compose projects..."
            # List all compose projects
            PROJECTS=$(docker compose ls --format json 2>/dev/null || echo "[]")
            echo "  -> Active projects:"
            echo "$PROJECTS" | sed 's/^/            /'
            echo ""
            echo "  NOTE: Manually stop the old project with:"
            echo "        docker compose -p <old-project-name> down --remove-orphans"
        fi
    fi

    REDIS_CONTAINERS=$(docker ps --filter "ancestor=redis:7-alpine" --format "{{.Names}}" 2>/dev/null || true)
    REDIS_COUNT=$(echo "$REDIS_CONTAINERS" | grep -c . 2>/dev/null || echo "0")

    if [ "$REDIS_COUNT" -gt 1 ]; then
        echo "  CONFLICT: $REDIS_COUNT Redis containers running:"
        echo "$REDIS_CONTAINERS" | sed 's/^/            /'
        CONFLICTS_FOUND=true
    fi

    MINIO_CONTAINERS=$(docker ps --filter "ancestor=minio/minio:latest" --format "{{.Names}}" 2>/dev/null || true)
    MINIO_COUNT=$(echo "$MINIO_CONTAINERS" | grep -c . 2>/dev/null || echo "0")

    if [ "$MINIO_COUNT" -gt 1 ]; then
        echo "  CONFLICT: $MINIO_COUNT MinIO containers running:"
        echo "$MINIO_CONTAINERS" | sed 's/^/            /'
        CONFLICTS_FOUND=true
    fi

    if [ "$PG_COUNT" -le 1 ] && [ "$REDIS_COUNT" -le 1 ] && [ "$MINIO_COUNT" -le 1 ]; then
        echo "  OK — no duplicate Docker stacks"
    fi
else
    echo "  SKIP — Docker is not running"
fi

# ------------------------------------------
# Summary
# ------------------------------------------
echo ""
echo "========================================="
if [ "$CONFLICTS_FOUND" = true ]; then
    if [ "$AUTO_FIX" = true ]; then
        echo "  Conflicts were found and auto-fixed where possible."
        echo "  For duplicate Docker stacks, manual cleanup is needed."
    else
        echo "  CONFLICTS DETECTED!"
        echo ""
        echo "  To auto-fix host services, run:"
        echo "    sudo bash deploy/check-conflicts.sh --auto-fix"
        echo ""
        echo "  To stop a duplicate Docker stack:"
        echo "    docker compose -p <project-name> down --remove-orphans"
    fi
else
    echo "  No conflicts found. All clear!"
fi
echo "========================================="
echo ""

if [ "$CONFLICTS_FOUND" = true ] && [ "$AUTO_FIX" = false ]; then
    exit 1
fi

exit 0
