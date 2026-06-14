#!/bin/bash
# =====================================================
# Restore Database trên VPS mới
# =====================================================
# Chạy script này trên VPS mới SAU KHI đã docker compose up
# 
# Cách dùng:
#   bash deploy-package/restore-database.sh backup_2026-06-14.dump

set -e

CONTAINER="datn_db"
DB_USER="datn_admin"
DB_NAME="air_quality_db"

# Kiểm tra tham số
if [ -z "$1" ]; then
    echo "Cách dùng: bash restore-database.sh <file_backup.dump>"
    echo "Ví dụ:    bash restore-database.sh backup_2026-06-14.dump"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Lỗi: Không tìm thấy file $BACKUP_FILE"
    exit 1
fi

echo "=== Restore database từ $BACKUP_FILE ==="
echo "Container: $CONTAINER"
echo "Database:  $DB_NAME"
echo ""

# Chờ database sẵn sàng
echo "Đang chờ database khởi động..."
for i in $(seq 1 30); do
    if docker exec "$CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
        echo "Database đã sẵn sàng!"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "Lỗi: Database không khởi động sau 30 giây"
        exit 1
    fi
    sleep 1
done

# Copy file backup vào container
echo "Đang copy file backup vào container..."
docker cp "$BACKUP_FILE" "$CONTAINER":/tmp/backup.dump

# Drop và tạo lại database để restore sạch
echo "Đang xóa dữ liệu cũ và restore..."
docker exec "$CONTAINER" bash -c "
    # Terminate existing connections
    psql -U $DB_USER -d postgres -c \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();\" 2>/dev/null || true
    
    # Drop and recreate database
    dropdb -U $DB_USER --if-exists $DB_NAME
    createdb -U $DB_USER $DB_NAME
    
    # Restore with TimescaleDB pre-restore
    psql -U $DB_USER -d $DB_NAME -c 'CREATE EXTENSION IF NOT EXISTS timescaledb;'
    psql -U $DB_USER -d $DB_NAME -c \"SELECT timescaledb_pre_restore();\"
    
    pg_restore -U $DB_USER -d $DB_NAME --no-owner --no-privileges /tmp/backup.dump || true
    
    psql -U $DB_USER -d $DB_NAME -c \"SELECT timescaledb_post_restore();\"
    
    # Cleanup
    rm /tmp/backup.dump
"

echo ""
echo "=== Restore hoàn tất! ==="
echo "Kiểm tra bằng lệnh:"
echo "  docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c '\\dt'"
