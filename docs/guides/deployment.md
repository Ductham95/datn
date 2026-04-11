# Deployment — Hướng dẫn Triển khai Production

## Tổng quan

Hệ thống được triển khai trên **DigitalOcean Droplet** với domain `datn.thamnguyen.dev`, sử dụng **Docker Compose** để container hóa toàn bộ và **GitHub Actions** để tự động deploy khi push code.

### Kiến trúc triển khai

```
┌──────────────────────────────────────────────────────┐
│          DigitalOcean Droplet (Ubuntu 22.04)          │
│                  168.144.97.168                      │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │             Docker Compose                    │    │
│  │                                               │    │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────┐  │    │
│  │  │  Nginx  │  │ Backend  │  │TimescaleDB │  │    │
│  │  │ :80/:443│→ │  :3000   │  │   :5432    │  │    │
│  │  │  SSL    │  │  Node.js │  │ PostgreSQL │  │    │
│  │  │Frontend │  │  Prisma  │  │  + PostGIS │  │    │
│  │  │ static  │  │Socket.IO │  │            │  │    │
│  │  └─────────┘  └──────────┘  └────────────┘  │    │
│  │                                               │    │
│  │  ┌─────────┐                                  │    │
│  │  │Certbot  │  SSL auto-renewal                │    │
│  │  └─────────┘                                  │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
         ↑                           ↑
   datn.thamnguyen.dev        SSH tunnel (pgAdmin4)
   (A record → IP)            127.0.0.1:5432
```

### File cấu hình

| File | Mục đích |
|------|----------|
| `Dockerfile` | Build backend (Node.js 22 + Prisma) |
| `nginx/Dockerfile` | Build frontend (Vite) + Nginx |
| `nginx/nginx.conf` | HTTPS config (SSL + reverse proxy) |
| `nginx/nginx.init.conf` | HTTP config (dùng lần đầu cho Certbot) |
| `docker-compose.prod.yml` | Orchestrate 4 services |
| `.env.production` | Biến môi trường (KHÔNG commit) |
| `.github/workflows/deploy.yml` | CI/CD GitHub Actions |
| `scripts/setup-vps.sh` | Script setup VPS lần đầu |
| `scripts/deploy.sh` | Script deploy thủ công |

---

## 1. Yêu cầu

| Thuộc tính | Tối thiểu | Hiện tại |
|---|---|---|
| **CPU** | 1 vCPU | 1 vCPU |
| **RAM** | 1 GB + 2 GB Swap | 1 GB + 2 GB Swap |
| **Disk** | 25 GB SSD | 25 GB SSD |
| **OS** | Ubuntu 22.04 | Ubuntu 22.04 |
| **Domain** | Có A record trỏ về IP | `datn.thamnguyen.dev` |

> **Lưu ý**: VPS 1 GB RAM cần thêm **2 GB swap** để build Docker images (Vite + Node.js rất tốn RAM khi build).

---

## 2. Setup lần đầu

### Bước 1: Tạo VPS

1. Tạo DigitalOcean Droplet (Ubuntu 22.04, gói Basic $6/tháng)
2. Thêm A record: `datn.thamnguyen.dev` → IP Droplet

### Bước 2: SSH vào VPS và thêm swap

```bash
ssh root@168.144.97.168

# Thêm 2 GB swap (bắt buộc cho VPS 1 GB RAM)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Bước 3: Clone repo và chạy setup

```bash
apt update && apt install -y git curl
git clone https://github.com/Ductham95/datn.git /opt/datn
cd /opt/datn
chmod +x scripts/setup-vps.sh
./scripts/setup-vps.sh
```

Script tự động:
1. Cài Docker + Docker Compose
2. Tạo `.env.production` với mật khẩu ngẫu nhiên
3. Build & start containers (HTTP mode)
4. Lấy SSL certificate từ Let's Encrypt
5. Chuyển sang HTTPS mode
6. Thiết lập SSL auto-renewal (cron)

> ⚠️ **Ghi nhớ** mật khẩu DB và Provision Key hiển thị trên terminal!

### Bước 4: Thiết lập CI/CD (GitHub Actions)

Trên VPS, tạo SSH key:
```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_deploy   # Copy toàn bộ private key
```

Vào [GitHub Settings → Secrets → Actions](https://github.com/Ductham95/datn/settings/secrets/actions), thêm:

| Secret | Giá trị |
|--------|---------|
| `VPS_HOST` | `168.144.97.168` |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | Private key từ bước trên |

---

## 3. Deploy hàng ngày

### Tự động (khuyên dùng)

Chỉ cần push code lên GitHub:

```bash
git add .
git commit -m "mô tả thay đổi"
git push
```

GitHub Actions sẽ tự động:
1. SSH vào VPS
2. `git pull origin main`
3. `docker compose --env-file .env.production -f docker-compose.prod.yml up --build -d`
4. Dọn dẹp Docker images cũ

Xem tiến trình: **GitHub → Actions tab**

> **Thời gian deploy**: ~2-3 phút (build frontend + backend)

> **Bỏ qua deploy**: Commit chỉ sửa `docs/`, `firmware/`, `hardware/`, hoặc `*.md` sẽ không trigger deploy.

### Thủ công

```bash
ssh root@168.144.97.168
cd /opt/datn
./scripts/deploy.sh
```

---

## 4. Biến môi trường

File `.env.production` trên VPS (`/opt/datn/.env.production`):

```env
# PostgreSQL Container (dùng bởi Docker image)
POSTGRES_USER=datn_admin
POSTGRES_PASSWORD=<mật khẩu mạnh>
POSTGRES_DB=air_quality_db

# Backend App
DB_HOST=db
DB_PORT=5432
DB_USER=datn_admin
DB_PASSWORD=<mật khẩu mạnh>
DB_NAME=air_quality_db
DATABASE_URL=postgresql://datn_admin:<mật khẩu>@db:5432/air_quality_db?schema=public

PORT=3000
NODE_ENV=production
DOMAIN=datn.thamnguyen.dev
PROVISION_KEY=airquality2026
WEATHER_API_KEY=<api key>
```

> ⚠️ Sau khi sửa `.env.production`, cần **recreate** container (không chỉ restart):
> ```bash
> docker compose --env-file .env.production -f docker-compose.prod.yml up -d --force-recreate
> ```

---

## 5. Kết nối Database (pgAdmin4)

Database chỉ expose port `5432` trên `127.0.0.1` (an toàn, không mở ra internet).

### Cấu hình pgAdmin4

**Tab General**: Name = `DATN Production`

**Tab Connection**:

| Mục | Giá trị |
|-----|---------|
| Host | `localhost` |
| Port | `5432` |
| Database | `air_quality_db` |
| Username | `datn_admin` |
| Password | *(xem .env.production)* |

**Tab SSH Tunnel**:

| Mục | Giá trị |
|-----|---------|
| Use SSH tunneling | ✅ Bật |
| Tunnel host | `168.144.97.168` |
| Tunnel port | `22` |
| Username | `root` |
| Authentication | Password |
| Password | *(mật khẩu SSH VPS)* |

---

## 6. Monitoring

### Kiểm tra nhanh

```bash
# Health check
curl https://datn.thamnguyen.dev/health

# Trạng thái containers
ssh root@168.144.97.168 "cd /opt/datn && docker compose --env-file .env.production -f docker-compose.prod.yml ps"
```

### Xem logs

```bash
ssh root@168.144.97.168

cd /opt/datn

# Tất cả logs
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f --tail=50

# Logs từng service
docker compose --env-file .env.production -f docker-compose.prod.yml logs backend --tail=50
docker compose --env-file .env.production -f docker-compose.prod.yml logs nginx --tail=50
docker compose --env-file .env.production -f docker-compose.prod.yml logs db --tail=50
```

### Restart service

```bash
# Restart 1 service
docker compose --env-file .env.production -f docker-compose.prod.yml restart backend

# Restart tất cả
docker compose --env-file .env.production -f docker-compose.prod.yml restart
```

---

## 7. SSL Certificate

SSL Certificate được cấp bởi **Let's Encrypt** (miễn phí, tự động renew).

### Kiểm tra cert

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm \
    --entrypoint "certbot" certbot certificates
```

### Renew thủ công

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm \
    --entrypoint "certbot" certbot renew
docker compose --env-file .env.production -f docker-compose.prod.yml restart nginx
```

> SSL auto-renewal đã được thiết lập qua cron job (chạy mỗi tuần, lúc 3:00 sáng thứ Hai).

---

## 8. Backup & Restore Database

### Backup

```bash
ssh root@168.144.97.168
docker exec datn_db pg_dump -U datn_admin air_quality_db > backup_$(date +%Y%m%d).sql
```

### Restore

```bash
docker exec -i datn_db psql -U datn_admin air_quality_db < backup_20260411.sql
```

### Tải backup về máy local

```bash
scp root@168.144.97.168:/opt/datn/backup_20260411.sql ./
```

---

## 9. Troubleshooting

### Container bị crash / restart liên tục

```bash
# Xem log lỗi
docker compose --env-file .env.production -f docker-compose.prod.yml logs <service> --tail=50

# Rebuild container
docker compose --env-file .env.production -f docker-compose.prod.yml up --build -d <service>
```

### Lỗi `env_file` — biến môi trường không cập nhật

```bash
# PHẢI dùng --force-recreate (restart không reload env_file)
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --force-recreate
```

### Lỗi build — hết RAM

```bash
# Kiểm tra swap
free -h

# Thêm swap nếu chưa có
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

### SSL cert hết hạn

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm \
    --entrypoint "certbot" certbot renew
docker compose --env-file .env.production -f docker-compose.prod.yml restart nginx
```

### Reset hoàn toàn (xóa tất cả dữ liệu)

```bash
cd /opt/datn
docker compose --env-file .env.production -f docker-compose.prod.yml down -v
./scripts/setup-vps.sh
```

> ⚠️ **`-v` sẽ xóa toàn bộ database!** Backup trước khi reset.
