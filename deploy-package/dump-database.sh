#!/bin/bash
# =====================================================
# Dump Database ra file SQL từ VPS hiện tại
# =====================================================
# Chạy script này trên VPS production (168.144.97.168)
# Output: backup_YYYY-MM-DD.sql (file SQL đọc được)
#
# Cách dùng:
#   ssh root@168.144.97.168
#   cd /opt/datn
#   bash deploy-package/dump-database.sh

set -e

CONTAINER="datn_db"
DB_USER="datn_admin"
DB_NAME="air_quality_db"
BACKUP_FILE="backup_$(date +%Y-%m-%d).sql"

echo "=== Dump database ra file SQL ==="
echo "Database: $DB_NAME"
echo "Output:   $BACKUP_FILE"
echo ""

# Dump database dạng plain SQL (đọc được, import dễ)
docker exec "$CONTAINER" pg_dump \
    -U "$DB_USER" \
    --no-owner \
    --no-privileges \
    --inserts \
    "$DB_NAME" > "$BACKUP_FILE"

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo ""
echo "=== Hoàn tất! ==="
echo "File: $BACKUP_FILE ($FILE_SIZE)"
echo ""
echo "Copy file về máy local (chạy trên máy Windows):"
echo "  scp root@168.144.97.168:/opt/datn/$BACKUP_FILE D:\\datn\\deploy-package\\"
