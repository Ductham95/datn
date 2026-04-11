#!/bin/bash
# =====================================================
# Script deploy (được gọi bởi GitHub Actions hoặc thủ công)
# =====================================================

set -e

APP_DIR="/opt/datn"
cd $APP_DIR

echo "📥 Pulling latest code..."
git pull origin main

echo "🔨 Building and restarting containers..."
docker compose --env-file .env.production -f docker-compose.prod.yml up --build -d

echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo ""
echo "📋 Container status:"
docker compose --env-file .env.production -f docker-compose.prod.yml ps

echo ""
echo "✅ Deploy completed at $(date)"
