# 🚀 Hướng Dẫn Deploy Hệ Thống Giám Sát Chất Lượng Không Khí

Hướng dẫn triển khai hệ thống lên VPS mới bằng Docker Compose.

---

## Yêu Cầu Hệ Thống

| Phần mềm | Phiên bản | Cài đặt |
|-----------|-----------|---------|
| Docker | >= 20 | [docs.docker.com/engine/install](https://docs.docker.com/engine/install/ubuntu/) |
| Docker Compose | >= 2.0 | Đi kèm Docker Engine |
| Git | >= 2.0 | `apt install git` |

**VPS tối thiểu**: 1 vCPU, 2 GB RAM, 20 GB SSD (Ubuntu 22.04 khuyến nghị)

---

## Các Bước Triển Khai

### Bước 1: Cài Docker (nếu chưa có)

```bash
# Cài Docker
curl -fsSL https://get.docker.com | sh

# Kiểm tra
docker --version
docker compose version
```

### Bước 2: Clone repository

```bash
cd /opt
git clone https://github.com/Ductham95/datn.git
cd datn
```

### Bước 3: Cấu hình môi trường

```bash
# Copy file env mẫu
cp deploy-package/.env.example .env.production
```

Mở file `.env.production` và **thay đổi các giá trị**:

```bash
nano .env.production
```

**Các giá trị CẦN thay đổi:**

| Biến | Mô tả | Ví dụ |
|------|--------|-------|
| `POSTGRES_PASSWORD` | Mật khẩu database (đặt mật khẩu mạnh) | `MyStr0ngP@ss` |
| `DB_PASSWORD` | Giống `POSTGRES_PASSWORD` | `MyStr0ngP@ss` |
| `DATABASE_URL` | Thay phần password trong URL | `postgresql://datn_admin:MyStr0ngP@ss@db:5432/...` |
| `DOMAIN` | Domain hoặc IP của VPS | `192.168.1.100` hoặc `airquality.example.com` |
| `PROVISION_KEY` | Key xác thực gateway (đặt giá trị bất kỳ) | `my-secret-key-123` |
| `WEATHER_API_KEY` | API key OpenWeatherMap (nếu cần) | Đăng ký tại openweathermap.org |

> **Lưu ý:** Đảm bảo `POSTGRES_PASSWORD`, `DB_PASSWORD` và password trong `DATABASE_URL` đều **giống nhau**.

### Bước 4: Copy nginx config

```bash
# Dùng config HTTP (không SSL) cho đơn giản
cp deploy-package/nginx-http.conf nginx/active.conf
```

### Bước 5: Khởi động hệ thống

```bash
docker compose --env-file .env.production -f deploy-package/docker-compose.yml up --build -d
```

Lần đầu sẽ mất **5-10 phút** để build frontend và backend.

### Bước 6: Kiểm tra

```bash
# Xem trạng thái các container
docker compose -f deploy-package/docker-compose.yml ps

# Health check
curl http://localhost/health

# Xem logs (nếu có lỗi)
docker compose -f deploy-package/docker-compose.yml logs -f --tail=50
```

Truy cập dashboard: `http://<IP_VPS>`

---

## Restore Dữ Liệu (Tùy Chọn)

Nếu muốn có dữ liệu sẵn từ hệ thống hiện tại:

### Trên VPS cũ (dump)

```bash
ssh root@168.144.97.168
cd /opt/datn
bash deploy-package/dump-database.sh
```

### Copy file backup về máy local, rồi lên VPS mới

```bash
# Từ máy local:
scp root@168.144.97.168:/opt/datn/backup_2026-06-14.dump ./
scp backup_2026-06-14.dump root@<IP_VPS_MỚI>:/opt/datn/
```

### Trên VPS mới (restore)

```bash
cd /opt/datn
bash deploy-package/restore-database.sh backup_2026-06-14.dump
```

> **Lưu ý:** Restore sẽ **xóa toàn bộ dữ liệu hiện có** trong database và thay thế bằng dữ liệu từ file backup.

---

## Quản Lý Hệ Thống

### Xem logs

```bash
# Tất cả services
docker compose -f deploy-package/docker-compose.yml logs -f --tail=50

# Từng service riêng
docker compose -f deploy-package/docker-compose.yml logs backend --tail=50
docker compose -f deploy-package/docker-compose.yml logs db --tail=50
docker compose -f deploy-package/docker-compose.yml logs nginx --tail=50
```

### Khởi động lại

```bash
# Restart tất cả
docker compose -f deploy-package/docker-compose.yml restart

# Restart 1 service
docker compose -f deploy-package/docker-compose.yml restart backend
```

### Dừng hệ thống

```bash
# Dừng (giữ dữ liệu)
docker compose -f deploy-package/docker-compose.yml down

# Dừng VÀ xóa dữ liệu (CẨN THẬN!)
docker compose -f deploy-package/docker-compose.yml down -v
```

### Cập nhật code mới

```bash
cd /opt/datn
git pull
docker compose --env-file .env.production -f deploy-package/docker-compose.yml up --build -d
```

---

## Cấu Trúc File

```
deploy-package/
├── docker-compose.yml      # Docker Compose (DB + Backend + Nginx)
├── .env.example             # File env mẫu
├── nginx-http.conf          # Nginx config (HTTP, không SSL)
├── dump-database.sh         # Script dump database từ VPS cũ
├── restore-database.sh      # Script restore database trên VPS mới
└── README.md                # File này
```

---

## FAQ

**Q: Truy cập bằng HTTPS được không?**
A: Mặc định dùng HTTP. Nếu cần HTTPS, cần cấu hình thêm Certbot + domain. Liên hệ sinh viên để được hỗ trợ.

**Q: Quên mật khẩu admin?**
A: Mật khẩu admin mặc định trong database seed là `admin` / `admin123`. Nếu đã restore từ backup, dùng mật khẩu của hệ thống cũ.

**Q: Container crash liên tục?**
A: Kiểm tra logs: `docker compose -f deploy-package/docker-compose.yml logs <tên_service>`. Nguyên nhân thường gặp: sai password database trong `.env.production`.
