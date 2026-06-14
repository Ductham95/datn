#!/bin/bash
# =====================================================
# Dump Database từ VPS hiện tại (DigitalOcean)
# =====================================================
# Chạy script này trên VPS production (168.144.97.168)
# File output: backup_YYYY-MM-DD.dump
#
# Cách dùng:
#   ssh root@168.144.97.168
#   cd /opt/datn
#   bash deploy-package/dump-database.sh

set -e

CONTAINER="datn_db"
DB_USER="datn_admin"
DB_NAME="air_quality_db"
BACKUP_FILE="backup_$(date +%Y-%m-%d).dump"

echo "=== Dump database từ container $CONTAINER ==="
echo "Database: $DB_NAME"
echo "Output:   $BACKUP_FILE"
echo ""

# Dump database (custom format, hỗ trợ TimescaleDB)
docker exec "$CONTAINER" pg_dump \
    -U "$DB_USER" \
    -Fc \
    --no-owner \
    --no-privileges \
    "$DB_NAME" > "$BACKUP_FILE"

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo ""
echo "=== Hoàn tất! ==="
echo "File: $BACKUP_FILE ($FILE_SIZE)"
echo ""
echo "Bước tiếp theo: copy file này về máy local"
echo "  scp root@168.144.97.168:/opt/datn/$BACKUP_FILE ./"
