# 🌍 Hệ Thống Giám Sát Chất Lượng Không Khí Đô Thị

Hệ thống IoT giám sát chất lượng không khí theo thời gian thực sử dụng **ESP32**, **LoRa AS32-TTL-100** (433 MHz), cảm biến bụi mịn **PMS7003**, cảm biến khí **CCS811**, cảm biến nhiệt độ/độ ẩm **DHT22**. Dữ liệu được truyền qua LoRa đến Gateway, gửi lên server qua HTTP POST và hiển thị trên dashboard web React.

---

## Kiến trúc hệ thống

```
[Sensor Node]              [Gateway]              [Backend]           [Frontend]
 ESP32 + LoRa    --LoRa-->  ESP32 + LoRa  --HTTP-->  Node.js   <--HTTP/WS-->  React
 PMS7003                    WiFi + HTTP       PostgreSQL           ECharts
 CCS811                     POST batch        TimescaleDB          Leaflet
 DHT22                                        PostGIS + Prisma     Socket.IO
```

## Cấu trúc thư mục

```
datn/
├── backend/              # Backend Node.js (Express + Prisma + PostgreSQL)
│   ├── database/         # SQL init scripts (TimescaleDB + PostGIS)
│   ├── prisma/           # Prisma schema (ORM)
│   └── src/
│       ├── controllers/  # Request handlers
│       ├── services/     # Business logic (AQI, telemetry, cron...)
│       ├── routes/       # REST API endpoints
│       ├── middlewares/  # Auth (JWT), validation
│       └── server.js     # Entry point
├── firmware/             # Firmware ESP32 (PlatformIO)
│   ├── sensor-node/      # FreeRTOS (4 task: Sensor, LoRa, Battery, Watchdog)
│   └── gateway/          # Superloop (WiFi + LoRa RX + HTTP POST batch)
├── frontend/             # Frontend React + Vite (đang phát triển)
├── hardware/             # Sơ đồ nguyên lý mạch
├── docs/                 # 📖 Tài liệu kỹ thuật
└── docker-compose.yml    # Docker cho TimescaleDB
```

## Quick Start

### 1. Clone

```bash
git clone <repository-url>
cd datn
```

### 2. Khởi động Database

```bash
docker compose up -d
```

### 3. Chạy Backend

```bash
cd backend
npm install
npx prisma generate
npm run dev
```

Server chạy tại: `http://localhost:3000`

### 4. Chạy Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại: `http://localhost:5173`

### 5. Flash Firmware (nếu có ESP32)

```bash
cd firmware/sensor-node    # hoặc firmware/gateway
pio run -e esp32dev -t upload --upload-port <COM_PORT>
pio device monitor --port <COM_PORT> --baud 115200
```

---

## Yêu cầu

### Phần mềm

| Công cụ | Phiên bản | Mục đích |
|---------|-----------|----------|
| Node.js | >= 18 | Chạy backend server |
| Docker | >= 20 | Chạy database (TimescaleDB) |
| PlatformIO | >= 6.0 | Nạp firmware ESP32 |
| Git | >= 2.0 | Quản lý mã nguồn |

### Phần cứng

- 4x ESP32 DevKit V1 (3 node + 1 gateway)
- 4x Module LoRa AS32-TTL-100 (433MHz, UART)
- 3x Cảm biến bụi mịn PMS7003
- 3x Cảm biến khí CCS811
- 3x Cảm biến nhiệt độ/độ ẩm DHT22
- Pin 18650, TP4056, breadboard, dây nối

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|------------|-----------|
| Frontend | React, Vite, ECharts, Leaflet, Socket.IO |
| Backend | Node.js, Express, Prisma, Socket.IO |
| Database | PostgreSQL + TimescaleDB + PostGIS |
| Firmware | ESP32 Arduino (PlatformIO), FreeRTOS |
| LoRa | AS32-TTL-100 (UART, 433 MHz) |
| Infrastructure | Docker, PM2, Nginx |

## Tài liệu

📖 Xem tài liệu đầy đủ tại [docs/README.md](docs/README.md)

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/v1/stations/dashboard` | Dashboard tất cả trạm + AQI |
| GET | `/api/v1/stations/nearest?lat=&lng=` | Trạm gần nhất (PostGIS) |
| GET | `/api/v1/stations/:id/history` | Lịch sử dữ liệu |
| GET | `/api/v1/weather?lat=&lng=` | Thời tiết (OpenWeatherMap) |
| POST | `/api/v1/telemetry` | Nhận dữ liệu từ Gateway |
| POST | `/api/v1/admin/login` | Đăng nhập admin (JWT) |
| GET | `/api/v1/admin/gateways` | Danh sách gateways |
| GET | `/api/v1/admin/nodes` | Danh sách sensor nodes |
| GET | `/api/v1/admin/export/measurements` | Xuất CSV |

Xem chi tiết: [docs/backend/api-reference.md](docs/backend/api-reference.md)
