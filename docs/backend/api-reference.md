# API Reference — Tài liệu REST API

Base URL: `http://localhost:3000`

---

## 1. User APIs — Dữ liệu cho người dùng

### `GET /api/v1/stations/dashboard`

Lấy dashboard tất cả trạm kèm chỉ số AQI hiện tại.

**Response:**
```json
{
  "stations": [
    {
      "id": "NODE_001",
      "name": "Node 1 - Thư viện",
      "status": "active",
      "battery_level": 95,
      "latest": {
        "pm25": 12.5,
        "pm10": 18.3,
        "co2": 485,
        "tvoc": 120,
        "temperature": 28.5,
        "humidity": 65.2,
        "aqi": 52,
        "aqi_info": { "level": "moderate", "label": "Trung bình", "color": "#ffff00" }
      }
    }
  ]
}
```

---

### `GET /api/v1/stations/nearest`

Tìm trạm đo gần nhất dựa trên tọa độ GPS (dùng PostGIS).

**Query Parameters:**

| Param | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `lat` | float | ✅ | Vĩ độ |
| `lng` | float | ✅ | Kinh độ |

**Ví dụ:**
```
GET /api/v1/stations/nearest?lat=10.7733&lng=106.6575
```

---

### `GET /api/v1/stations/:id/history`

Lấy lịch sử dữ liệu theo trạm.

**Path Parameters:**

| Param | Mô tả |
|---|---|
| `id` | ID của sensor node (VD: `NODE_001`) |

**Query Parameters:**

| Param | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `mode` | string | `hourly` | `hourly` (từ Continuous Aggregate) hoặc `raw` |
| `from` | ISO datetime | 24h trước | Thời gian bắt đầu |
| `to` | ISO datetime | now | Thời gian kết thúc |

---

### `GET /api/v1/weather`

Lấy thông tin thời tiết hiện tại (proxy từ OpenWeatherMap API).

**Query Parameters:**

| Param | Kiểu | Mô tả |
|---|---|---|
| `lat` | float | Vĩ độ |
| `lng` | float | Kinh độ |

---

## 2. Gateway API — Nhận dữ liệu từ Gateway

### `POST /api/v1/telemetry`

Nhận batch dữ liệu cảm biến từ Gateway.

**Request Body:**
```json
{
  "gateway_id": "GW_001",
  "readings": [
    {
      "node_id": "NODE_001",
      "pm25": 12.5,
      "pm10": 18.3,
      "co2": 485,
      "tvoc": 120,
      "temperature": 28.5,
      "humidity": 65.2,
      "battery": 85,
      "rssi": 0
    }
  ]
}
```

**Validation:**
- `gateway_id`: bắt buộc, phải tồn tại trong DB
- `readings`: mảng, mỗi phần tử phải có `node_id`
- Dữ liệu cảm biến: kiểm tra kiểu số (number)

**Response (201):**
```json
{
  "message": "OK",
  "count": 1
}
```

**Side effects:**
1. Lưu vào bảng `measurements` (TimescaleDB)
2. Cập nhật `last_seen` trong bảng `gateways`
3. Cập nhật `battery_level`, `lora_rssi` trong bảng `sensor_nodes`
4. Broadcast qua Socket.IO cho tất cả frontend clients

---

## 3. Admin APIs — Quản trị hệ thống

> [!NOTE]
> Tất cả Admin APIs (trừ `/login`) yêu cầu header `Authorization: Bearer <JWT_TOKEN>`.

### `POST /api/v1/admin/login`

Đăng nhập admin, trả về JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### `GET /api/v1/admin/gateways`

Lấy danh sách tất cả gateways. **Yêu cầu auth.**

---

### `GET /api/v1/admin/nodes`

Lấy danh sách tất cả sensor nodes. **Yêu cầu auth.**

---

### `GET /api/v1/admin/export/measurements`

Xuất dữ liệu đo lường ra CSV. **Yêu cầu auth.**

**Query Parameters:**

| Param | Kiểu | Mô tả |
|---|---|---|
| `node_id` | string | Lọc theo node |
| `from` | ISO datetime | Thời gian bắt đầu |
| `to` | ISO datetime | Thời gian kết thúc |

**Response:** File CSV download

---

## 4. Realtime — Socket.IO

| Event | Hướng | Mô tả |
|---|---|---|
| `connection` | Client → Server | Kết nối WebSocket |
| `new-measurement` | Server → Client | Broadcast khi có dữ liệu mới từ Gateway |
| `disconnect` | Client → Server | Ngắt kết nối |

**Frontend kết nối:**
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');
socket.on('new-measurement', (data) => {
  console.log('Dữ liệu mới:', data);
});
```

---

## 5. Health Check

### `GET /health`

Kiểm tra server đang chạy.

**Response:** `200 OK`
