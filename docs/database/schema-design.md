# Schema Design — Thiết kế Cơ sở Dữ liệu

## 1. Tổng quan

Hệ thống sử dụng **PostgreSQL** kết hợp hai extension **TimescaleDB** và **PostGIS** để xử lý 3 loại dữ liệu đặc thù trong một hệ quản trị duy nhất:

| Loại dữ liệu | Extension | Ví dụ |
|---|---|---|
| **Time-series** (chuỗi thời gian) | TimescaleDB | Đo lường PM2.5, CO₂ liên tục mỗi 5 phút |
| **Geospatial** (không gian) | PostGIS | Tọa độ GPS các trạm đo, tìm trạm gần nhất |
| **Relational** (quan hệ) | PostgreSQL core | Users, Gateways, cấu hình hệ thống |

---

## 2. Sơ đồ quan hệ (ERD)

```mermaid
erDiagram
    users {
        UUID id PK
        VARCHAR username UK
        VARCHAR password_hash
        VARCHAR role
        TIMESTAMPTZ created_at
    }

    gateways {
        VARCHAR id PK
        VARCHAR name
        VARCHAR location_desc
        VARCHAR status
        TIMESTAMPTZ last_seen
    }

    sensor_nodes {
        VARCHAR id PK
        VARCHAR gateway_id FK
        VARCHAR name
        GEOMETRY geom
        VARCHAR status
        INT battery_level
        INT lora_rssi
        TIMESTAMPTZ last_seen
    }

    measurements {
        TIMESTAMPTZ time PK
        VARCHAR node_id PK-FK
        FLOAT pm25
        FLOAT pm10
        INT co2
        INT tvoc
        FLOAT temperature
        FLOAT humidity
    }

    gateways ||--o{ sensor_nodes : "has many"
    sensor_nodes ||--o{ measurements : "produces"
```

---

## 3. Chi tiết các bảng

### 3.1. Bảng `users` — Người dùng & Quản trị viên

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | UUID | PK, auto-gen | Định danh duy nhất |
| `username` | VARCHAR(100) | UNIQUE, NOT NULL | Tên đăng nhập |
| `password_hash` | VARCHAR(255) | NOT NULL | Mật khẩu đã hash (bcrypt) |
| `role` | VARCHAR(20) | DEFAULT 'user' | Quyền: `admin` hoặc `user` |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Thời gian tạo |

### 3.2. Bảng `gateways` — Trạm trung chuyển LoRa-WiFi

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | VARCHAR(50) | PK | ID gateway (VD: `GW_001`) |
| `name` | VARCHAR(100) | NOT NULL | Tên hiển thị |
| `location_desc` | VARCHAR(255) | — | Mô tả vị trí lắp đặt |
| `status` | VARCHAR(20) | DEFAULT 'offline' | Trạng thái: `online` / `offline` |
| `last_seen` | TIMESTAMPTZ | — | Lần cuối gửi dữ liệu |

### 3.3. Bảng `sensor_nodes` — Trạm cảm biến (tích hợp PostGIS)

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `id` | VARCHAR(50) | PK | ID node (VD: `NODE_001`) |
| `gateway_id` | VARCHAR(50) | FK → gateways.id | Gateway phụ trách |
| `name` | VARCHAR(100) | NOT NULL | Tên hiển thị |
| `geom` | GEOMETRY(Point, 4326) | — | Tọa độ PostGIS (kinh độ, vĩ độ) |
| `status` | VARCHAR(20) | DEFAULT 'active' | `active` / `inactive` / `lost_connection` |
| `battery_level` | INT | DEFAULT 100 | Phần trăm pin (0–100) |
| `lora_rssi` | INT | — | Tín hiệu LoRa (dBm) |
| `last_seen` | TIMESTAMPTZ | — | Lần cuối node gửi dữ liệu |

### 3.4. Bảng `measurements` — Dữ liệu đo lường (TimescaleDB Hypertable)

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `time` | TIMESTAMPTZ | PK (composite) | Thời điểm đo |
| `node_id` | VARCHAR(50) | PK (composite), FK | Node gửi dữ liệu |
| `pm25` | FLOAT | — | Bụi mịn PM2.5 (µg/m³) |
| `pm10` | FLOAT | — | Bụi PM10 (µg/m³) |
| `co2` | INT | — | CO₂ (ppm) |
| `tvoc` | INT | — | TVOC (ppb) |
| `temperature` | FLOAT | — | Nhiệt độ (°C) |
| `humidity` | FLOAT | — | Độ ẩm (%) |

---

## 4. Tính năng TimescaleDB

### 4.1. Hypertable

Bảng `measurements` được chuyển thành Hypertable — tự động partition theo trục thời gian:

```sql
SELECT create_hypertable('measurements', 'time', if_not_exists => TRUE);
```

### 4.2. Continuous Aggregates

View tự động tính trung bình theo giờ — Dashboard load biểu đồ lịch sử gần như ngay lập tức:

```sql
CREATE MATERIALIZED VIEW hourly_measurements
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', time) AS bucket_time,
       node_id,
       AVG(pm25) AS avg_pm25,
       AVG(pm10) AS avg_pm10,
       AVG(co2) AS avg_co2,
       MAX(temperature) AS max_temp
FROM measurements
GROUP BY bucket_time, node_id;
```

### 4.3. Retention Policy

Tự động xóa dữ liệu raw quá 3 tháng, giữ lại dữ liệu aggregate cho báo cáo:

```sql
SELECT add_retention_policy('measurements', INTERVAL '3 months');
```

---

## 5. Tính năng PostGIS

### Tìm trạm đo gần nhất

Khi người dùng gửi tọa độ GPS, Backend dùng PostGIS thay vì tính toán Haversine thủ công:

```sql
SELECT id, name, location_desc,
       ST_Distance(geom, ST_SetSRID(ST_MakePoint($lng, $lat), 4326), true) as distance_meters
FROM sensor_nodes
ORDER BY geom <-> ST_SetSRID(ST_MakePoint($lng, $lat), 4326)
LIMIT 1;
```

---

## 6. Khởi tạo Database

File SQL khởi tạo: [`backend/database/init.sql`](../../backend/database/init.sql)

Được tự động chạy khi Docker container khởi động lần đầu:

```yaml
# docker-compose.yml
volumes:
  - ./backend/database/init.sql:/docker-entrypoint-initdb.d/init.sql
```

Xem thêm: [Workflow: Khởi tạo Database](../../.agents/workflows/run-database.md)

---

## 7. Database Migrations

Khi cần thay đổi schema trên database **đã tồn tại** (production), sử dụng file migration riêng thay vì sửa `init.sql`.

> [!IMPORTANT]
> `init.sql` chỉ chạy lần đầu khi tạo container. Các thay đổi schema sau đó **phải** được thêm vào `migrations.sql`.

### File migration

File: [`backend/database/migrations.sql`](../../backend/database/migrations.sql)

Mỗi lệnh migration phải sử dụng `IF NOT EXISTS` / `IF EXISTS` để chạy an toàn nhiều lần (idempotent):

```sql
-- Đúng ✅
ALTER TABLE sensor_nodes ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

-- Sai ❌ (sẽ lỗi nếu chạy lần 2)
ALTER TABLE sensor_nodes ADD COLUMN last_seen TIMESTAMPTZ;
```

### Quy trình thêm cột/bảng mới

1. Cập nhật `backend/prisma/schema.prisma` (thêm field mới)
2. Chạy `npx prisma generate` để cập nhật Prisma Client
3. Thêm lệnh `ALTER TABLE` vào `backend/database/migrations.sql`
4. Cập nhật `backend/database/init.sql` (cho lần khởi tạo mới)
5. Push code → CI/CD tự động chạy migration trên production

### Chạy migration thủ công

```bash
# Local
docker exec datn_postgres_db psql -U datn_admin -d air_quality_db -f /tmp/migrations.sql

# Production (SSH vào VPS)
docker cp /opt/datn/backend/database/migrations.sql datn_db:/tmp/migrations.sql
docker exec datn_db psql -U datn_admin -d air_quality_db -f /tmp/migrations.sql
```
