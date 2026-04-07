# Tech Stack — Công nghệ Sử dụng

## Firmware (ESP32 — PlatformIO/Arduino)

| Công nghệ | Phiên bản | Mục đích | Ghi chú |
|---|---|---|---|
| **ESP32 Arduino** | — | Framework firmware | Chạy trên nền FreeRTOS |
| **PMS Library** | `fu-hsi/PMS Library` | Đọc PMS7003 qua UART | PM2.5, PM10 |
| **Adafruit CCS811** | `adafruit/Adafruit CCS811 Library` | Đọc CO₂/TVOC qua I2C | Cần warm-up 20 phút |
| **DHT sensor library** | `adafruit/DHT sensor library` | Đọc DHT22 (nhiệt độ/độ ẩm) | 1-Wire protocol |
| **ArduinoJson** | `bblanchon/ArduinoJson` | Serialize JSON cho HTTP POST | Chỉ dùng ở Gateway |
| **FreeRTOS** | Tích hợp sẵn ESP32 | Multi-task cho Sensor Node | 4 task pinned to core |

> [!NOTE]
> Module LoRa AS32-TTL-100 giao tiếp qua UART transparently — **không cần thư viện LoRa bên ngoài**. Driver UART tự viết.

## Backend

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| **Node.js** | >= 18 | Runtime |
| **Express.js** | ^4.21 | REST API framework |
| **Prisma** | ^7.5 | ORM cho PostgreSQL |
| **PostgreSQL** | >= 15 | RDBMS chính |
| **TimescaleDB** | Extension | Time-series: Hypertable, Continuous Aggregates, Retention Policy |
| **PostGIS** | Extension | Geospatial: tìm trạm gần nhất, lưu tọa độ |
| **Socket.IO** | ^4.7 | Realtime push dữ liệu đến frontend |
| **JWT** | `jsonwebtoken` ^9.0 | Xác thực Admin |
| **bcryptjs** | ^3.0 | Hash mật khẩu |
| **node-cron** | ^4.2 | Background jobs (kiểm tra thiết bị offline) |
| **json2csv** | ^6.0 | Xuất dữ liệu CSV |
| **Helmet** | ^8.1 | Security HTTP headers |

### Lý do chọn PostgreSQL + TimescaleDB + PostGIS

Thay vì dùng 3 database riêng (MySQL + InfluxDB + MongoDB), hệ thống sử dụng **một PostgreSQL duy nhất** với 2 extension:

1. **TimescaleDB**: Biến bảng `measurements` thành Hypertable tự động partition theo thời gian → INSERT/SELECT cực nhanh cho time-series data từ IoT
2. **PostGIS**: Lưu tọa độ trạm bằng kiểu `GEOMETRY(Point, 4326)` → truy vấn không gian (tìm trạm gần nhất) chỉ bằng 1 câu SQL
3. **PostgreSQL core**: Quản lý users, gateways, sensor nodes — tính toàn vẹn ACID

## Frontend

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| **React** | ^19.0 | UI framework |
| **Vite** | ^6.2 | Build tool (HMR, code splitting) |
| **Zustand** | ^5.0 | State management (auth, telemetry) |
| **React Router** | ^7.4 | Client-side routing (13 routes, lazy-loaded) |
| **Axios** | ^1.8 | HTTP client (interceptors, base URL) |
| **ECharts** | `echarts-for-react` | Biểu đồ lịch sử (bar chart) |
| **Leaflet** | `react-leaflet` ^5.0 | Bản đồ AQI (markers, popups) |
| **Socket.IO Client** | ^4.8 | Nhận dữ liệu realtime |
| **react-i18next** | ^15.4 | Đa ngôn ngữ (Tiếng Việt / English) |
| **Lucide React** | ^0.484 | Icon library (200+ icons) |
| **CSS Modules** | Built-in Vite | Component-scoped styling |

> [!NOTE]
> Frontend sử dụng **CSS Modules + Design Tokens** (CSS Variables) thay vì TailwindCSS để kiểm soát styling tối đa.

## Infrastructure

| Công nghệ | Mục đích |
|---|---|
| **Docker** | Container cho TimescaleDB |
| **docker-compose** | Orchestration |
| **PlatformIO** | Build + flash firmware ESP32 |
| **Git** | Quản lý mã nguồn |

## Công cụ phát triển

| Công cụ | Phiên bản | Mục đích |
|---|---|---|
| **Node.js** | >= 18 | Chạy backend |
| **PlatformIO CLI** | >= 6.0 | Nạp firmware ESP32 |
| **Docker** | >= 20 | Chạy database |
| **Git** | >= 2.0 | Quản lý mã nguồn |
| **VS Code** | Mới nhất | Editor (với PlatformIO extension) |
