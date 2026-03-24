# Thiết kế Cơ sở Dữ liệu Hệ thống với PostgreSQL (TimescaleDB + PostGIS)

Tài liệu này trình bày lý do và thiết kế thiết kế kiến trúc khi sử dụng **PostgreSQL** kết hợp với hai extension **TimescaleDB** và **PostGIS** cho dự án Hệ thống giám sát chất lượng không khí đô thị qua LoRa.

## 1. Lý do lựa chọn PostgreSQL + Extensions

Hệ thống IoT giám sát chất lượng không khí của dự án (theo `Các chức năng của hệ thống (dự kiến).md`) có 3 loại dữ liệu đặc thù kết hợp. Việc sử dụng PostgreSQL và 2 extension giúp giải quyết toàn diện chỉ trong MỘT hệ quản trị CSDL duy nhất:

### A. Dữ liệu thời gian thực (Time-series) -> TimescaleDB
- Dữ liệu từ các sensor node (PM2.5, PM10, CO2, Nhiệt độ, TVOC...) gửi về liên tục thông qua Gateway sẽ tạo ra một lượng dữ liệu chuỗi thời gian khổng lồ.
- **TimescaleDB** biến bảng PostgreSQL thông thường thành các `Hypertable`, tự động phân mảnh (partition) khối lượng dữ liệu theo trục thời gian, giúp tốc độ ghi (INSERT) và truy xuất (SELECT) cực kỳ nhanh.
- **Continuous Aggregates**: Tự động tính toán trước các giá trị (ví dụ: trung bình PM2.5 mỗi giờ, mỗi ngày). Giúp chức năng "Xem lịch sử theo Giờ / Ngày" trên Dashboard load biểu đồ gần như ngay lập tức mà Backend không cần tốn dụng lượng RAM tính toán Group By.

### B. Dữ liệu định vị (Geospatial) -> PostGIS
- Vị trí lắp đặt của các Sensor Node và Gateway là điểm trên bản đồ thực tế (Kinh độ / Vĩ độ).
- **PostGIS** hỗ trợ chuẩn hóa kiểu lưu trữ hình học (ví dụ: `GEOMETRY(Point)`) và các thuật toán tìm kiếm không gian.
- Phục vụ trực tiếp chức năng: *Dựa vào vị trí người dùng để gợi ý trạm đo gần nhất* và *Bản đồ AQI toàn khu vực*.

### C. Dữ liệu quan hệ (Relational Data) -> PostgreSQL Lõi
- Quản lý người dùng, phân quyền Admin, trạng thái/cấu hình của thiết bị, bảng log hệ thống các chỉnh sửa từ Admin.
- Tính toàn vẹn dữ liệu (ACID) của PostgresSQL đảm bảo độ chính xác cho các logic này.

---

## 2. Thiết kế Schema dự kiến

### 2.1. Các bảng Dữ liệu quan hệ (Relational Tables)

**Bảng `users` (Người dùng & Quản trị viên)**
- `id` (UUID, Primary Key)
- `username` (VARCHAR)
- `password_hash` (VARCHAR)
- `role` (ENUM: 'admin', 'user')
- `created_at` (TIMESTAMPTZ)

**Bảng `gateways` (Trạm trung chuyển LoRa-WiFi)**
- `id` (VARCHAR, Primary Key - Mac Address của thiết bị)
- `name` (VARCHAR)
- `location_desc` (VARCHAR)
- `status` (ENUM: 'online', 'offline')
- `last_seen` (TIMESTAMPTZ) - *Phục vụ chức năng giám sát Last seen từ Admin*

**Bảng `sensor_nodes` (Trạm cảm biến - Tích hợp PostGIS)**
- `id` (VARCHAR, Primary Key)
- `gateway_id` (Foreign Key -> gateways.id)
- `name` (VARCHAR)
- `geom` (GEOMETRY(Point, 4326)) - *Lưu tọa độ kinh tuyến, vĩ tuyến bằng PostGIS*
- `status` (ENUM: 'active', 'inactive', 'lost_connection')
- `battery_level` (INT)
- `lora_rssi` (INT) - *Mức độ tín hiệu kết nối LoRa*

### 2.2. Bảng Dữ liệu Chuỗi thời gian (Hypertable - TimescaleDB)

**Bảng `measurements` (Chỉ số đo lường Sensor)**
- `time` (TIMESTAMPTZ, Index quan trọng nhất)
- `node_id` (VARCHAR, Foreign Key -> sensor_nodes.id)
- `pm25` (FLOAT)
- `pm10` (FLOAT)
- `co2` (INT)
- `tvoc` (INT)
- `temperature` (FLOAT)
- `humidity` (FLOAT)

*Câu lệnh SQL để cấu hình Hypertable:*
```sql
SELECT create_hypertable('measurements', 'time');
```

---

## 3. Ứng dụng triển khai thuật toán tính năng

### 3.1. Tìm trạm đo gần người dùng nhất (Ứng dụng PostGIS)
Khi người dùng truy cập Web/App từ điện thoại và gửi tọa độ (Kinh độ `lng`, Vĩ độ `lat`), Backend dùng 1 câu lệnh SQL duy nhất để tìm trạm gần nhất thay vì phải dùng công thức Haversine để tính khoảng cách với tất cả các trạm:
```sql
SELECT id, name, location_desc,
       ST_Distance(geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326), true) as distance_meters
FROM sensor_nodes
ORDER BY geom <-> ST_SetSRID(ST_MakePoint(lng, lat), 4326)
LIMIT 1;
```

### 3.2. Dashboard thời gian thực và Biểu đồ Lịch sử (Ứng dụng TimescaleDB)
Thay vì SQL truyền thống phải chạy lệnh SUM/AVG cho vài triệu raw data record mỗi khi User/Admin bấm "Xem lịch sử", DBA sẽ cấu hình một view chạy ngầm (Continuous Aggregates):
```sql
CREATE MATERIALIZED VIEW hourly_measurements
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', time) AS bucket_time,
       node_id,
       AVG(pm25) as avg_pm25,
       AVG(pm10) as avg_pm10,
       AVG(co2) as avg_co2,
       MAX(temperature) as max_temp
FROM measurements
GROUP BY bucket_time, node_id;
```
Khi Dashboard gọi API lịch sử ngày, API chỉ gọi `SELECT * FROM hourly_measurements`, tốc độ phản hồi chỉ vài mili-giây.

### 3.3. Tự động dọn dẹp dữ liệu (Data Retention)
Sensor gửi 5-10 phút/lần sẽ gây đầy Local Storage trên hệ thống Server. Giải pháp ứng dụng là thiết lập chức năng Retension của TimescaleDB xóa dữ liệu raw cũ quá 3 tháng, nhưng **vẫn giữ lại** dữ liệu đã nhóm (Continuous Aggregates) để làm báo cáo thống kê các năm.
```sql
SELECT add_retention_policy('measurements', INTERVAL '3 months');
```
