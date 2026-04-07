# Server Architecture — Kiến trúc Backend Server

## 1. Tổng quan

Backend server chạy trên **Node.js + Express**, sử dụng **Prisma ORM** để tương tác với PostgreSQL.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Express Server                           │
│                                                                 │
│  ┌──────────┐   ┌──────────────┐   ┌───────────────┐          │
│  │  Routes   │──▶│ Controllers  │──▶│   Services    │          │
│  │          │   │              │   │               │          │
│  │ userApi  │   │ station      │   │ station       │          │
│  │ adminApi │   │ telemetry    │   │ telemetry     │──▶ Prisma │──▶ PostgreSQL
│  │ gateway  │   │ auth         │   │ aqi           │          │
│  │          │   │ export       │   │ weather       │          │
│  └──────────┘   │ weather      │   │ export        │          │
│       │         └──────────────┘   │ cronJobs      │          │
│       │                            └───────────────┘          │
│  ┌──────────┐                                                  │
│  │Middleware │   ┌──────────────┐                              │
│  │ helmet   │   │  Socket.IO   │──▶ Broadcast realtime        │
│  │ cors     │   └──────────────┘                              │
│  │ auth     │                                                  │
│  │ validate │                                                  │
│  └──────────┘                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Cấu trúc thư mục

```
backend/src/
├── server.js                     # Entry point — Express + Socket.IO + Prisma init
├── config/
│   └── prismaClient.js           # Prisma client singleton
├── routes/
│   ├── userApi.js                # User endpoints (/api/v1/stations/*)
│   ├── gatewayApi.js             # Gateway endpoint (/api/v1/telemetry)
│   └── adminapi.js               # Admin endpoints (/api/v1/admin/*)
├── controllers/
│   ├── stationController.js      # getDashboardStations, getNearestStation, getStationHistory
│   ├── telemetryController.js    # ingestTelemetryData
│   ├── authController.js         # login
│   ├── adminDeviceController.js  # CRUD gateways/nodes
│   ├── alertConfigController.js  # getConfig, updateConfig
│   ├── alertController.js        # getAlerts, acknowledgeAlert, deleteAlert
│   ├── exportController.js       # exportMeasurements (CSV)
│   └── weatherController.js      # getWeather
├── services/
│   ├── stationService.js         # Business logic cho station data
│   ├── telemetryService.js       # Lưu measurement + cập nhật device status + check thresholds
│   ├── aqiService.js             # Tính AQI (US EPA), đánh giá CO₂/TVOC
│   ├── authService.js            # Xác thực + JWT
│   ├── deviceService.js          # Quản lý thiết bị (CRUD)
│   ├── alertConfigService.js     # Quản lý cấu hình ngưỡng
│   ├── alertService.js           # Quản lý cảnh báo + threshold check + retention
│   ├── exportService.js          # Xuất CSV
│   ├── weatherService.js         # Proxy OpenWeatherMap
│   └── cronJobs.js               # Background jobs (offline detection, alert cleanup)
├── middlewares/
│   └── authMiddleware.js         # JWT verification (verifyAdmin)
├── validations/
│   ├── gatewayValidation.js      # Validate payload từ gateway
│   ├── adminValidation.js        # Validate CRUD gateway/node
│   └── configValidation.js       # Validate cấu hình ngưỡng
├── models/                       # (Legacy — không dùng, Prisma thay thế)
└── utils/                        # Utility functions
```

---

## 3. Request Pipeline

```
Client Request
     │
     ▼
┌──────────┐
│ Helmet   │  ← Security headers
│ CORS     │  ← Cross-origin
│ JSON     │  ← Parse body
└──────────┘
     │
     ▼
┌──────────┐
│  Route   │  ← Match URL pattern
└──────────┘
     │
     ▼
┌──────────┐
│Middleware │  ← Validate input / Verify JWT (nếu cần auth)
└──────────┘
     │
     ▼
┌──────────┐
│Controller│  ← Xử lý request, gọi service
└──────────┘
     │
     ▼
┌──────────┐
│ Service  │  ← Business logic + Prisma queries
└──────────┘
     │
     ▼
┌──────────┐
│ Response │  ← JSON / CSV / Error
└──────────┘
```

---

## 4. Startup Sequence (`server.js`)

```
1. Load .env (dotenv)
2. Set timezone: Asia/Ho_Chi_Minh
3. Init Express + middlewares (Helmet, CORS, JSON)
4. Init Socket.IO
5. Mount routes:
   - /api/v1/*         → User APIs
   - /api/v1/telemetry → Gateway API
   - /api/v1/admin/*   → Admin APIs
6. Connect Prisma → PostgreSQL
7. Set DB timezone
8. Start Cron Jobs (offline detection)
9. Listen on PORT (default: 3000)
```

---

## 5. Background Jobs (Cron)

File: `services/cronJobs.js`

| Job | Chu kỳ | Chức năng |
|---|---|---|
| Offline Detection | Mỗi 5 phút | Kiểm tra `last_seen` của gateways/nodes, đánh dấu `offline` nếu > 10 phút |

---

## 6. Socket.IO Integration

Socket.IO được inject vào mỗi request thông qua middleware:

```javascript
app.use((req, res, next) => {
  req.io = io;  // Inject Socket.IO instance
  next();
});
```

Trong telemetry controller, sau khi lưu data:
```javascript
req.io.emit('new-measurement', { node_id, data });
```

---

## 7. Biến môi trường (`.env`)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=datn_admin
DB_PASSWORD=datn_password
DB_NAME=air_quality_db
DATABASE_URL="postgresql://datn_admin:datn_password@localhost:5432/air_quality_db?schema=public"

# Server
PORT=3000
```
