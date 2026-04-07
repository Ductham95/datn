# Deployment — Hướng dẫn Triển khai Production

## 1. Yêu cầu VPS/Cloud

| Thuộc tính | Tối thiểu | Khuyến nghị |
|---|---|---|
| **CPU** | 1 vCPU | 2 vCPU |
| **RAM** | 1 GB | 2 GB |
| **Disk** | 20 GB SSD | 40 GB SSD |
| **OS** | Ubuntu 22.04 | Ubuntu 22.04 |
| **Network** | Public IP | Public IP + domain |

---

## 2. Cài đặt trên VPS

### Cài Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Cài Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cài Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Thêm user vào group docker
sudo usermod -aG docker $USER
```

### Cài Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 3. Deploy Database

```bash
cd datn
docker compose up -d
```

Kiểm tra:
```bash
docker ps  # Container datn_postgres_db đang running
```

---

## 4. Deploy Backend

### Cài dependencies

```bash
cd backend
npm install --production
npx prisma generate
```

### Cấu hình `.env` production

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=datn_admin
DB_PASSWORD=<strong_password>
DB_NAME=air_quality_db
DATABASE_URL="postgresql://datn_admin:<strong_password>@localhost:5432/air_quality_db?schema=public"

PORT=3000
NODE_ENV=production
```

### Chạy với PM2

```bash
# Cài PM2
sudo npm install -g pm2

# Start server
pm2 start src/server.js --name airquality-backend

# Auto-start khi reboot
pm2 startup
pm2 save
```

### Cấu hình Nginx (Reverse Proxy)

```bash
sudo apt install nginx -y
```

Tạo file `/etc/nginx/sites-available/airquality`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/airquality /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 5. Deploy Frontend

### Build

```bash
cd frontend
npm install
npm run build
```

Thư mục `dist/` sẽ được tạo. Backend tự động serve static files từ `../frontend/dist/`.

---

## 6. Cấu hình Gateway (Firmware)

Trước khi flash firmware gateway, sửa `include/config.h`:

```cpp
#define WIFI_SSID       "wifi-tai-vi-tri-lap-dat"
#define WIFI_PASSWORD   "mat-khau-wifi"
#define API_URL         "http://your-domain.com/api/v1/telemetry"
#define GATEWAY_ID      "GW_001"
```

---

## 7. Monitoring

### Kiểm tra logs

```bash
# Backend logs
pm2 logs airquality-backend

# Database logs
docker logs datn_postgres_db

# Nginx logs
sudo tail -f /var/log/nginx/access.log
```

### Health check

```bash
curl http://localhost:3000/health
```

---

## 8. Backup Database

```bash
# Backup
docker exec datn_postgres_db pg_dump -U datn_admin air_quality_db > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i datn_postgres_db psql -U datn_admin air_quality_db < backup_20260407.sql
```
