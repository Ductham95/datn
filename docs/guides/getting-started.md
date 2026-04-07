# Getting Started — Bắt đầu nhanh

Hướng dẫn chạy hệ thống trên máy tính trong 5 phút.

---

## Yêu cầu

| Công cụ | Phiên bản | Cài đặt |
|---|---|---|
| **Node.js** | >= 18 | [nodejs.org](https://nodejs.org/) |
| **Docker** | >= 20 | [docker.com](https://docs.docker.com/get-docker/) |
| **Git** | >= 2.0 | [git-scm.com](https://git-scm.com/) |
| **PlatformIO** | >= 6.0 | [platformio.org](https://platformio.org/) (chỉ cần nếu flash firmware) |

---

## Bước 1: Clone dự án

```bash
git clone <repository-url>
cd datn
```

## Bước 2: Khởi động Database

```bash
docker compose up -d
```

Lệnh này sẽ:
- Tải image TimescaleDB (PostgreSQL 15 + TimescaleDB + PostGIS)
- Chạy container `datn_postgres_db` trên port `5432`
- Tự động chạy `backend/database/init.sql` (tạo bảng, Hypertable, seed data)

Kiểm tra database đã chạy:
```bash
docker ps
# Phải thấy container datn_postgres_db đang running
```

## Bước 3: Chạy Backend

```bash
cd backend
npm install
npm run dev
```

Server sẽ chạy tại: `http://localhost:3000`

Kiểm tra:
```bash
curl http://localhost:3000/health
```

## Bước 4: Chạy Frontend (khi có)

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

---

## Kiểm tra nhanh

### Test API

```bash
# Lấy dashboard (có seed data)
curl http://localhost:3000/api/v1/stations/dashboard

# Giả lập Gateway gửi dữ liệu
curl -X POST http://localhost:3000/api/v1/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "gateway_id": "GW_001",
    "readings": [{
      "node_id": "NODE_001",
      "pm25": 15.2,
      "pm10": 22.5,
      "co2": 520,
      "tvoc": 95,
      "temperature": 29.1,
      "humidity": 68.5,
      "battery": 90,
      "rssi": 0
    }]
  }'
```

---

## Bước tiếp theo

- Xem [Cài đặt chi tiết](development-setup.md) nếu cần hướng dẫn cụ thể hơn
- Xem [API Reference](../backend/api-reference.md) cho danh sách đầy đủ endpoints
- Xem [Flash Firmware](../firmware/sensor-node.md) nếu bạn có phần cứng ESP32
