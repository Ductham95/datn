# Development Setup — Cài đặt Môi trường Phát triển

Hướng dẫn chi tiết cài đặt đầy đủ cho phát triển.

---

## 1. Cài đặt công cụ

### Node.js (>= 18)

```bash
# Windows: Tải installer từ https://nodejs.org/

# Kiểm tra
node --version   # >= 18
npm --version    # >= 9
```

### Docker Desktop

```bash
# Windows: Tải từ https://docs.docker.com/desktop/install/windows-install/

# Kiểm tra
docker --version
docker compose version
```

### PlatformIO (cho firmware)

Cài đặt PlatformIO IDE extension trong VS Code:
1. Mở VS Code → Extensions → Tìm "PlatformIO IDE" → Install
2. Hoặc cài CLI: `pip install platformio`

```bash
# Kiểm tra
pio --version   # >= 6.0
```

---

## 2. Database — PostgreSQL (TimescaleDB + PostGIS)

### Khởi động qua Docker

```bash
cd datn
docker compose up -d
```

File `docker-compose.yml` sẽ:
- Image: `timescale/timescaledb-ha:pg15`
- Port: `5432`
- User/Password: `datn_admin` / `datn_password`
- Database: `air_quality_db`
- Init script: `backend/database/init.sql`

### Kiểm tra kết nối

```bash
# Dùng psql từ bên trong container
docker exec -it datn_postgres_db psql -U datn_admin -d air_quality_db

# Kiểm tra extensions
\dx
# Phải thấy: timescaledb, postgis, uuid-ossp

# Kiểm tra bảng
\dt
# Phải thấy: users, gateways, sensor_nodes, measurements

# Thoát
\q
```

### Reset database

```bash
# Xóa hoàn toàn và tạo lại
docker compose down -v
docker compose up -d
```

---

## 3. Backend — Node.js Express

### Cài đặt

```bash
cd backend
npm install
```

### Cấu hình `.env`

File `.env` đã có sẵn với thông tin mặc định phù hợp Docker:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=datn_admin
DB_PASSWORD=datn_password
DB_NAME=air_quality_db
DATABASE_URL="postgresql://datn_admin:datn_password@localhost:5432/air_quality_db?schema=public"

PORT=3000

# Optional: OpenWeatherMap API key (đăng ký miễn phí tại https://openweathermap.org/api)
WEATHER_API_KEY=your_api_key_here
```

> [!TIP]
> Nếu không có `WEATHER_API_KEY`, widget thời tiết trên Dashboard sẽ tự động dùng dữ liệu nhiệt độ/độ ẩm từ cảm biến thay thế.

### Generate Prisma Client

```bash
npx prisma generate
```

### Chạy Development Server

```bash
npm run dev
```

Server chạy tại `http://localhost:3000` với auto-reload (nodemon).

### Prisma Studio (GUI Database)

```bash
npx prisma studio
```

Mở browser tại `http://localhost:5555` để xem/sửa dữ liệu.

---

## 4. Frontend — React + Vite

### Cài đặt

```bash
cd frontend
npm install
```

### Chạy Development Server

```bash
npm run dev
```

Frontend chạy tại `http://localhost:5173`.

### Build Production

```bash
npm run build
# Output: frontend/dist/
```

Backend tự động serve `frontend/dist/` khi chạy production.

---

## 5. Firmware — ESP32 (PlatformIO)

### Sensor Node

```bash
cd firmware/sensor-node

# Sửa config trước khi flash
# include/config.h → NODE_ID, LoRa params

# Build
pio run -e esp32dev

# Flash + Monitor
pio run -e esp32dev -t upload --upload-port <COM_PORT>
pio device monitor --port <COM_PORT> --baud 115200
```

### Gateway

```bash
cd firmware/gateway

# Sửa config trước khi flash
# include/config.h → WIFI_SSID, WIFI_PASSWORD, API_URL, GATEWAY_ID

# Build
pio run -e esp32dev

# Flash + Monitor
pio run -e esp32dev -t upload --upload-port <COM_PORT>
pio device monitor --port <COM_PORT> --baud 115200
```

> [!TIP]
> Trên Windows, tìm COM port trong Device Manager → Ports (COM & LPT). Thường là `COM3`, `COM4`,...

---

## 6. Thứ tự khởi động

```
1. Database:  docker compose up -d
2. Backend:   cd backend && npm run dev
3. Frontend:  cd frontend && npm run dev
4. Firmware:  PlatformIO flash (nếu có ESP32)
```
