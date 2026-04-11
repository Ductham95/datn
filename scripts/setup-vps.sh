#!/bin/bash
# =====================================================
# Script thiết lập VPS lần đầu
# Chạy trên DigitalOcean Droplet (Ubuntu 22.04)
# =====================================================

set -e

DOMAIN="datn.thamnguyen.dev"
EMAIL="ductham2004@gmail.com"
REPO_URL="https://github.com/Ductham95/datn.git"
APP_DIR="/opt/datn"

echo "========================================"
echo "  SETUP VPS - Air Quality Monitoring"
echo "  Domain: ${DOMAIN}"
echo "========================================"

# --------------------------------------------------
# 1. Cập nhật hệ thống
# --------------------------------------------------
echo ""
echo "[1/7] Cập nhật hệ thống..."
apt update && apt upgrade -y

# --------------------------------------------------
# 2. Cài Docker
# --------------------------------------------------
echo ""
echo "[2/7] Cài Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo "✅ Docker đã cài thành công"
else
    echo "✅ Docker đã có sẵn"
fi

# Kiểm tra docker compose plugin
if ! docker compose version &> /dev/null; then
    apt install -y docker-compose-plugin
fi

# --------------------------------------------------
# 3. Cài Git
# --------------------------------------------------
echo ""
echo "[3/7] Kiểm tra Git..."
if ! command -v git &> /dev/null; then
    apt install -y git
fi
echo "✅ Git: $(git --version)"

# --------------------------------------------------
# 4. Clone repository
# --------------------------------------------------
echo ""
echo "[4/7] Clone repository..."
if [ -d "$APP_DIR" ]; then
    echo "⚠️  Thư mục ${APP_DIR} đã tồn tại, pull code mới..."
    cd $APP_DIR
    git pull origin main
else
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

# --------------------------------------------------
# 5. Tạo file .env.production
# --------------------------------------------------
echo ""
echo "[5/7] Tạo file .env.production..."
if [ ! -f "$APP_DIR/.env.production" ]; then
    # Tạo mật khẩu ngẫu nhiên
    DB_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    PROV_KEY=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)

    cat > $APP_DIR/.env.production << EOF
# PostgreSQL Container (dùng bởi Docker image timescaledb-ha)
POSTGRES_USER=datn_admin
POSTGRES_PASSWORD=${DB_PASS}
POSTGRES_DB=air_quality_db

# Backend App
DB_HOST=db
DB_PORT=5432
DB_USER=datn_admin
DB_PASSWORD=${DB_PASS}
DB_NAME=air_quality_db
DATABASE_URL=postgresql://datn_admin:${DB_PASS}@db:5432/air_quality_db?schema=public

# Server
PORT=3000
NODE_ENV=production

# Domain
DOMAIN=${DOMAIN}

# Provisioning
PROVISION_KEY=${PROV_KEY}

# Weather API (thay bằng key thật)
WEATHER_API_KEY=ba88e8c7ea8e7009ed9a4184a4855144
EOF

    echo "✅ File .env.production đã tạo"
    echo "📝 Mật khẩu DB: ${DB_PASS}"
    echo "📝 Provision Key: ${PROV_KEY}"
    echo ""
    echo "⚠️  GHI NHỚ các giá trị này! Hoặc xem lại trong .env.production"
else
    echo "✅ File .env.production đã tồn tại"
fi

# --------------------------------------------------
# 6. Khởi động hệ thống (HTTP mode)
# --------------------------------------------------
echo ""
echo "[6/7] Khởi động hệ thống (HTTP mode)..."
cd $APP_DIR

# Dùng nginx.init.conf (HTTP only) lần đầu
cp nginx/nginx.init.conf nginx/active.conf

# Build và start containers
docker compose -f docker-compose.prod.yml up --build -d

echo "⏳ Đợi containers khởi động (30s)..."
sleep 30

# Kiểm tra containers
echo ""
echo "📋 Trạng thái containers:"
docker compose -f docker-compose.prod.yml ps

# --------------------------------------------------
# 7. Cài SSL Certificate (Let's Encrypt)
# --------------------------------------------------
echo ""
echo "[7/7] Cài SSL Certificate..."

# Lấy SSL cert
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email ${EMAIL} \
    --agree-tos \
    --no-eff-email \
    -d ${DOMAIN}

if [ $? -eq 0 ]; then
    echo "✅ SSL Certificate đã cài thành công!"

    # Chuyển sang HTTPS config
    cp nginx/nginx.conf nginx/active.conf

    # Restart nginx để áp dụng SSL
    docker compose -f docker-compose.prod.yml restart nginx

    echo "✅ Đã chuyển sang HTTPS mode!"
else
    echo "❌ Lỗi cài SSL. Hệ thống vẫn chạy ở HTTP mode."
    echo "   Kiểm tra DNS: nslookup ${DOMAIN}"
    echo "   Thử lại: docker compose -f docker-compose.prod.yml run --rm certbot certonly --webroot --webroot-path=/var/www/certbot --email ${EMAIL} --agree-tos --no-eff-email -d ${DOMAIN}"
fi

# --------------------------------------------------
# 8. Thiết lập SSL auto-renewal (cron)
# --------------------------------------------------
echo ""
echo "📋 Thiết lập SSL auto-renewal..."
(crontab -l 2>/dev/null; echo "0 3 * * 1 cd ${APP_DIR} && docker compose -f docker-compose.prod.yml run --rm certbot renew && docker compose -f docker-compose.prod.yml restart nginx") | crontab -
echo "✅ Cron job đã thêm (renewal mỗi tuần)"

# --------------------------------------------------
# Hoàn tất
# --------------------------------------------------
echo ""
echo "========================================"
echo "  ✅ SETUP HOÀN TẤT!"
echo "========================================"
echo ""
echo "  🌐 Website: https://${DOMAIN}"
echo "  📡 API:     https://${DOMAIN}/api/v1"
echo "  🔌 Health:  https://${DOMAIN}/health"
echo ""
echo "  📂 App dir: ${APP_DIR}"
echo "  📄 Env:     ${APP_DIR}/.env.production"
echo ""
echo "  Tiếp theo:"
echo "  1. Thiết lập GitHub Secrets (xem scripts/setup-github-secrets.md)"
echo "  2. Push code để test CI/CD"
echo "========================================"
