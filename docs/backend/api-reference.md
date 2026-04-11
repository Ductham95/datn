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

### `GET /api/v1/stations/ranking`

Xếp hạng các trạm theo mức AQI từ cao đến thấp. **Public API.**

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "node_id": "NODE_001",
      "name": "Node 1 - Thư viện",
      "aqi": 85,
      "aqi_info": { "level": "moderate", "label": "Trung bình" },
      "...": "(các field giống dashboard)"
    }
  ]
}
```

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
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Gateway CRUD

#### `GET /api/v1/admin/gateways`

Lấy danh sách tất cả gateways. **Yêu cầu auth.**

---

#### `POST /api/v1/admin/gateways`

Thêm gateway mới. ID được hệ thống tự sinh theo format `GW_XXX`.

**Request Body:**
```json
{
  "name": "Gateway Đại học Bách Khoa",
  "location_desc": "Sân H1"
}
```

| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `name` | string | ✅ | Tên gateway, tối đa 100 ký tự |
| `location_desc` | string | ❌ | Mô tả vị trí, tối đa 255 ký tự |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "GW_002",
    "name": "Gateway Đại học Bách Khoa",
    "location_desc": "Sân H1",
    "status": "offline",
    "last_seen": null
  }
}
```

---

#### `PUT /api/v1/admin/gateways/:id`

Cập nhật thông tin gateway.

**Request Body** (chỉ gửi các field cần cập nhật):
```json
{
  "name": "Gateway Updated",
  "status": "online"
}
```

| Field | Kiểu | Giá trị hợp lệ |
|---|---|---|
| `name` | string | Tối đa 100 ký tự |
| `location_desc` | string | Tối đa 255 ký tự |
| `status` | string | `online`, `offline` |

**Response (200):** Trả về gateway sau khi cập nhật.

**Errors:** `404` nếu gateway không tồn tại.

---

#### `DELETE /api/v1/admin/gateways/:id`

Xóa gateway. **Chặn xóa** nếu còn sensor nodes liên kết.

**Response (200):**
```json
{
  "success": true,
  "message": "Đã xóa gateway \"Gateway Test\" thành công",
  "data": { "id": "GW_002", "name": "Gateway Test" }
}
```

**Response (409) — Có phụ thuộc:**
```json
{
  "success": false,
  "error": "Không thể xóa Gateway \"Gateway BK\" vì còn 3 sensor node đang liên kết. Vui lòng xóa hoặc chuyển tất cả sensor nodes trước khi xóa gateway.",
  "details": { "nodeCount": 3 }
}
```

---

### Sensor Node CRUD

#### `GET /api/v1/admin/nodes`

Lấy danh sách tất cả sensor nodes. **Yêu cầu auth.**

---

#### `POST /api/v1/admin/nodes`

Thêm sensor node mới. ID được hệ thống tự sinh theo format `NODE_XXX`.

**Request Body:**
```json
{
  "name": "Node 3 - Canteen",
  "gateway_id": "GW_001",
  "lat": 10.7733,
  "lng": 106.6575,
  "status": "active",
  "battery_level": 100
}
```

| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `name` | string | ✅ | Tên node, tối đa 100 ký tự |
| `gateway_id` | string | ✅ | ID gateway cha (phải tồn tại) |
| `lat` | float | ❌ | Vĩ độ (-90 → 90) |
| `lng` | float | ❌ | Kinh độ (-180 → 180) |
| `status` | string | ❌ | `active` / `inactive` / `maintenance` (mặc định: `active`) |
| `battery_level` | int | ❌ | 0–100 (mặc định: 100) |

> [!NOTE]
> Nếu cung cấp tọa độ, phải gửi cả `lat` và `lng`.

**Response (201):** Trả về node vừa tạo.

**Errors:** `400` nếu `gateway_id` không tồn tại.

---

#### `PUT /api/v1/admin/nodes/:id`

Cập nhật thông tin sensor node.

**Request Body** (chỉ gửi các field cần cập nhật):
```json
{
  "name": "Node 3 - Thư viện mới",
  "battery_level": 85
}
```

**Response (200):** Trả về node sau khi cập nhật.

**Errors:** `404` nếu node không tồn tại, `400` nếu `gateway_id` mới không hợp lệ.

---

#### `DELETE /api/v1/admin/nodes/:id`

Xóa sensor node. **Chặn xóa** nếu còn dữ liệu đo lường liên quan.

**Response (200):**
```json
{
  "success": true,
  "message": "Đã xóa sensor node \"Node Test\" thành công",
  "data": { "id": "NODE_003", "name": "Node Test" }
}
```

**Response (409) — Có phụ thuộc:**
```json
{
  "success": false,
  "error": "Không thể xóa Sensor Node \"Node 1\" vì còn 1500 bản ghi đo lường liên quan. Vui lòng xóa dữ liệu đo lường trước hoặc liên hệ quản trị viên hệ thống.",
  "details": { "measurementCount": 1500 }
}
```

---

### Export

#### `GET /api/v1/admin/export/measurements`

Xuất dữ liệu đo lường ra CSV. **Yêu cầu auth.**

**Query Parameters:**

| Param | Kiểu | Mô tả |
|---|---|---|
| `node_id` | string | Lọc theo node |
| `from` | ISO datetime | Thời gian bắt đầu |
| `to` | ISO datetime | Thời gian kết thúc |

**Response:** File CSV download

---

### Cấu hình ngưỡng cảnh báo (Config API)

#### `GET /api/v1/admin/config`

Lấy cấu hình ngưỡng cảnh báo hiện tại. **Yêu cầu auth.**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "pm25_warn": 35.4,
    "pm25_danger": 55.4,
    "pm10_warn": 154,
    "pm10_danger": 254,
    "co2_warn": 1000,
    "co2_danger": 2000,
    "tvoc_warn": 500,
    "tvoc_danger": 1000,
    "temp_min": 15,
    "temp_max": 40,
    "sampling_interval": 300,
    "updated_at": "2026-04-07T14:30:00.000Z"
  }
}
```

---

#### `PUT /api/v1/admin/config`

Cập nhật cấu hình ngưỡng cảnh báo (partial update). **Yêu cầu auth.**

**Request Body** (chỉ gửi các field cần cập nhật):
```json
{
  "pm25_warn": 25,
  "pm25_danger": 50,
  "sampling_interval": 600
}
```

| Field | Kiểu | Validation |
|---|---|---|
| `pm25_warn` | float | Số dương, phải < `pm25_danger` |
| `pm25_danger` | float | Số dương, phải > `pm25_warn` |
| `pm10_warn` | float | Số dương, phải < `pm10_danger` |
| `pm10_danger` | float | Số dương, phải > `pm10_warn` |
| `co2_warn` | int | Số nguyên dương, phải < `co2_danger` |
| `co2_danger` | int | Số nguyên dương, phải > `co2_warn` |
| `tvoc_warn` | int | Số nguyên dương, phải < `tvoc_danger` |
| `tvoc_danger` | int | Số nguyên dương, phải > `tvoc_warn` |
| `temp_min` | float | Phải < `temp_max` |
| `temp_max` | float | Phải > `temp_min` |
| `sampling_interval` | int | Số nguyên ≥ 60 (giây) |

**Response (200):** Trả về config sau khi cập nhật.

---

### Cảnh báo (Alerts API)

> [!NOTE]
> Alerts được tạo tự động bởi hệ thống khi:
> - **Threshold alert**: Dữ liệu cảm biến vượt ngưỡng (PM2.5, PM10, CO₂, TVOC, nhiệt độ)
> - **Connectivity alert**: Gateway/Node mất kết nối (phát hiện bởi cron job mỗi 5 phút)
>
> Cooldown: Không tạo alert trùng (cùng node + cùng metric) trong 15 phút.
> Retention: Alerts cũ hơn 30 ngày sẽ tự động bị xóa.

#### `GET /api/v1/admin/alerts`

Lấy danh sách cảnh báo, hỗ trợ filter + phân trang. **Yêu cầu auth.**

**Query Parameters:**

| Param | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `node_id` | string | — | Lọc theo node ID |
| `type` | string | — | `threshold` hoặc `connectivity` |
| `severity` | string | — | `warn` hoặc `danger` |
| `acknowledged` | boolean | — | `true` / `false` |
| `from` | ISO datetime | — | Thời gian bắt đầu |
| `to` | ISO datetime | — | Thời gian kết thúc |
| `page` | int | 1 | Trang hiện tại |
| `limit` | int | 50 | Số lượng mỗi trang |

**Response (200):**
```json
{
  "success": true,
  "alerts": [
    {
      "id": 1,
      "node_id": "NODE_001",
      "type": "threshold",
      "severity": "danger",
      "metric": "pm25",
      "value": 60.5,
      "threshold": 55.4,
      "message": "[NGUY HIỂM] PM2.5 tại NODE_001: 60.5 (ngưỡng: 55.4)",
      "acknowledged": false,
      "created_at": "2026-04-07T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "totalPages": 1
  }
}
```

---

#### `PATCH /api/v1/admin/alerts/:id/ack`

Xác nhận (acknowledge) 1 cảnh báo. **Yêu cầu auth.**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "acknowledged": true,
    "..."
  }
}
```

**Errors:** `404` nếu alert không tồn tại.

---

#### `DELETE /api/v1/admin/alerts/:id`

Xóa 1 cảnh báo. **Yêu cầu auth.**

**Response (200):**
```json
{
  "success": true,
  "message": "Đã xóa cảnh báo thành công",
  "data": { "id": 1, "message": "..." }
}
```

**Errors:** `404` nếu alert không tồn tại.

---

### Quản lý tài khoản (User Management API)

#### `GET /api/v1/admin/users`

Lấy danh sách tất cả users (ẩn password). **Yêu cầu auth.**

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "username": "admin", "role": "admin", "created_at": "..." }
  ]
}
```

---

#### `POST /api/v1/admin/users`

Tạo user mới. **Yêu cầu auth.**

**Request Body:**
```json
{ "username": "newuser", "password": "123456", "role": "user" }
```

| Field | Kiểu | Bắt buộc | Validation |
|---|---|---|---|
| `username` | string | ✅ | 3-100 ký tự, unique |
| `password` | string | ✅ | Tối thiểu 6 ký tự |
| `role` | string | ❌ | `admin` / `user` (mặc định: `user`) |

**Errors:** `409` nếu username đã tồn tại.

---

#### `PUT /api/v1/admin/users/:id`

Cập nhật thông tin user (username, role). **Yêu cầu auth.**

**Errors:** `404`, `409` (trùng username), `403` (hạ quyền admin cuối).

---

#### `DELETE /api/v1/admin/users/:id`

Xóa user. **Chặn xóa admin cuối cùng.** **Yêu cầu auth.**

**Errors:** `404`, `403` (admin cuối cùng).

---

#### `PUT /api/v1/admin/users/change-password`

Đổi mật khẩu của chính mình (dùng user ID từ JWT). **Yêu cầu auth.**

**Request Body:**
```json
{ "oldPassword": "123456", "newPassword": "newpass123" }
```

**Errors:** `401` nếu mật khẩu cũ sai.

---

### Log hệ thống (Audit Logs API)

> [!NOTE]
> Audit logs được tự động ghi bởi middleware cho mọi thao tác POST/PUT/PATCH/DELETE trên admin API.
> Thông tin nhạy cảm (password) được ẩn trong details.

#### `GET /api/v1/admin/logs`

Xem lịch sử hành động admin. **Yêu cầu auth.**

**Query Parameters:**

| Param | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `username` | string | — | Lọc theo username (partial match) |
| `action` | string | — | `CREATE` / `UPDATE` / `DELETE` / `LOGIN` / `CHANGE_PASSWORD` |
| `resource` | string | — | `gateway` / `node` / `user` / `config` / `alert` / `auth` |
| `from` | ISO datetime | — | Thời gian bắt đầu |
| `to` | ISO datetime | — | Thời gian kết thúc |
| `page` | int | 1 | Trang |
| `limit` | int | 50 | Số lượng mỗi trang |

**Response (200):**
```json
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "user_id": "uuid",
      "username": "admin",
      "action": "CREATE",
      "resource": "user",
      "resource_id": null,
      "details": "{\"username\":\"newuser\",\"password\":\"***\",\"role\":\"user\"}",
      "ip_address": "::1",
      "created_at": "2026-04-07T08:26:52.834Z"
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 4, "totalPages": 1 }
}
```

---

### Telemetry Logs (Raw Measurements) API

#### `GET /api/v1/admin/telemetry-logs`

Xem dữ liệu telemetry thô (raw measurements) từ các sensor node. **Yêu cầu auth.**

> [!NOTE]
> Trả về tối đa 500 bản ghi mỗi lần query, sắp xếp theo thời gian mới nhất.
> Dữ liệu được enrich thêm tên node và chỉ số AQI tính từ PM2.5/PM10.

**Query Parameters:**

| Param | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| `node_id` | string | — | Lọc theo sensor node ID |
| `gateway_id` | string | — | Lọc theo gateway ID (lấy tất cả nodes thuộc gateway) |
| `from` | ISO datetime | — | Thời gian bắt đầu |
| `to` | ISO datetime | — | Thời gian kết thúc |
| `limit` | int | 500 | Số lượng tối đa (max: 500) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "time": "2026-04-07T14:30:00.000Z",
      "node_id": "NODE_001",
      "node_name": "Node 1 - Thư viện",
      "gateway_id": "GW_001",
      "pm25": 12.5,
      "pm10": 18.3,
      "co2": 485,
      "tvoc": 120,
      "temperature": 28.5,
      "humidity": 65.2,
      "aqi": 52
    }
  ],
  "total": 1500
}
```

---

## 4. Realtime — Socket.IO

| Event | Hướng | Mô tả |
|---|---|---|
| `connection` | Client → Server | Kết nối WebSocket |
| `new_telemetry_data` | Server → Client | Broadcast khi có dữ liệu mới từ Gateway |
| `new-alert` | Server → Client | Broadcast khi có cảnh báo mới (vượt ngưỡng) |
| `disconnect` | Client → Server | Ngắt kết nối |

**Frontend kết nối:**
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');
socket.on('new_telemetry_data', (data) => {
  console.log('Dữ liệu mới:', data);
});
socket.on('new-alert', ({ alerts }) => {
  console.log('Cảnh báo mới:', alerts);
});
```

---

## 5. Health Check

### `GET /health`

Kiểm tra server đang chạy.

**Response:** `200 OK`

---

## 6. Provisioning APIs — Thiết bị tự đăng ký

> [!NOTE]
> Provisioning APIs dùng `provision_key` để xác thực (không dùng JWT). Thiết bị ESP32 gọi trực tiếp các endpoint này trong quá trình cấu hình ban đầu.

### `POST /api/v1/provision/gateway`

Gateway ESP32 tự đăng ký với server.

**Request Body:**
```json
{
  "provision_key": "airquality2026",
  "name": "Gateway Tầng 3",
  "location_desc": "Gần cầu thang B"
}
```

| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `provision_key` | string | ✅ | Mã xác thực (phải khớp `PROVISION_KEY` trong `.env`) |
| `name` | string | ✅ | Tên gateway |
| `location_desc` | string | ❌ | Mô tả vị trí |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "GW_004",
    "name": "Gateway Tầng 3",
    "status": "online",
    "location_desc": "Gần cầu thang B"
  }
}
```

---

### `GET /api/v1/provision/gateways`

Lấy danh sách tất cả gateway (dùng cho Sensor Node chọn gateway).

**Query Parameters:**

| Param | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `provision_key` | string | ✅ | Mã xác thực |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "GW_001",
      "name": "Gateway Tầng 1",
      "status": "online",
      "location_desc": "Sảnh chính"
    }
  ]
}
```

---

### `POST /api/v1/provision/node`

Sensor Node ESP32 tự đăng ký dưới một gateway.

**Request Body:**
```json
{
  "provision_key": "airquality2026",
  "name": "Phòng họp 302",
  "gateway_id": "GW_003",
  "lat": 10.7733,
  "lng": 106.6575
}
```

| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `provision_key` | string | ✅ | Mã xác thực |
| `name` | string | ✅ | Tên sensor node |
| `gateway_id` | string | ✅ | ID gateway mà node thuộc về |
| `lat` | float | ❌ | Vĩ độ |
| `lng` | float | ❌ | Kinh độ |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "NODE_005",
    "name": "Phòng họp 302",
    "gateway_id": "GW_003",
    "status": "active",
    "battery_level": 100,
    "node_numeric_id": 5
  }
}
```

> [!NOTE]
> `node_numeric_id` được trích từ `NODE_XXX` → dùng làm `SensorPayload.nodeId` (1 byte) truyền qua LoRa.

Xem thêm: [Hướng dẫn Provisioning](../guides/provisioning.md)
