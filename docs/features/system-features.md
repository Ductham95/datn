# System Features — Chức năng Hệ thống

## Cho người dùng

### 1. Dashboard chất lượng không khí
- Hiển thị các thông số: **AQI, PM2.5, PM10, CO₂, TVOC, Nhiệt độ, Độ ẩm**
- **Cảnh báo sức khỏe**: So sánh với hướng dẫn WHO (VD: "PM2.5 cao gấp 6.8 lần") + khuyến nghị cho nhóm nhạy cảm
- Cập nhật thời gian thực qua Socket.IO

### 2. Gợi ý trạm gần nhất
- Dựa vào vị trí GPS của người dùng (Geolocation API trình duyệt)
- Tìm trạm đo gần nhất bằng PostGIS

### 3. Thời tiết hiện tại
- Nhiệt độ, tốc độ gió, hướng gió, độ ẩm
- Dữ liệu từ OpenWeatherMap API

### 4. Xem lịch sử
- Chế độ xem **Giờ / Ngày**
- Xem lịch sử theo từng thông số: AQI, PM2.5, PM10, CO₂, TVOC, nhiệt độ, độ ẩm
- **Biểu đồ cột** lịch sử theo thời gian (ECharts)
- **Bản đồ AQI** khu vực với các trạm đánh dấu bằng mã màu (Leaflet)

### 5. Bản đồ AQI
- Bản đồ toàn khu vực, các trạm hiển thị bằng chấm màu + số AQI
- Mã màu theo chuẩn US EPA (xanh → vàng → cam → đỏ → tím → nâu đỏ)

### 6. Xếp hạng vị trí ô nhiễm
- Sắp xếp các trạm theo mức AQI từ cao đến thấp

---

## Cho người quản trị

### 1. Quản lý thiết bị (Sensor Nodes & Gateways)
- Thêm mới, cập nhật thông tin, cấu hình hoặc xóa thiết bị (Gateway, Sensor Node)
- Giám sát trạng thái: online/offline, thời gian gửi dữ liệu cuối (Last seen)
- Xem thông tin chi tiết: ID, tín hiệu LoRa (RSSI), vị trí lắp đặt

### 2. Giám sát tình trạng mạng và phần cứng (Health Monitoring)
- Giám sát ổn định phần cứng và cảm biến (PMS7003, CCS811...)
- Cảnh báo sự cố: Node mất kết nối LoRa, Gateway mất kết nối WiFi/Server
- Theo dõi tình trạng pin thiết bị

### 3. Quản lý dữ liệu & Xuất báo cáo
- Xem, tìm kiếm, phân tích lịch sử dữ liệu thô
- **Xuất dữ liệu CSV** theo trạm, theo khoảng thời gian
- Báo cáo tỷ lệ truyền nhận (packet loss) và uptime thiết bị

### 4. Cấu hình hệ thống
- Thiết lập ngưỡng cảnh báo (PM2.5, AQI)
- Thiết lập chu kỳ gửi dữ liệu (sampling rate)

### 5. Quản lý tài khoản
- Phân quyền admin/user
- Xem log hệ thống: lịch sử sửa/xóa/cấu hình từ các quản trị viên

---

## Trạng thái hiện tại (07/04/2026)

| Tính năng | Backend API | Frontend UI | Ghi chú |
|---|---|---|---|
| Dashboard AQI | ✅ | ✅ | 6 MetricCards + Realtime |
| Gợi ý trạm gần nhất | ✅ (PostGIS) | ✅ | Geolocation + PostGIS |
| Xem lịch sử | ✅ (TimescaleDB) | ✅ | ECharts bar chart 24h |
| Thời tiết | ✅ | ✅ | OWM + sensor fallback |
| Bản đồ AQI | ✅ | ✅ | Leaflet + AQI markers |
| Nhận dữ liệu Gateway | ✅ | — | HTTP POST endpoint |
| Admin Login (JWT) | ✅ | ✅ | Form + Zustand store |
| Admin: CRUD Gateways | ✅ | ✅ | DataTable + Modal |
| Admin: CRUD Nodes | ✅ | ✅ | DataTable + Battery bar |
| Admin: Cảnh báo (Alerts) | ✅ | ✅ | Severity filter + Ack |
| Admin: Cấu hình ngưỡng | ✅ | ✅ | 6 threshold cards |
| Admin: Quản lý tài khoản | ✅ | ✅ | CRUD + role |
| Admin: Log hệ thống | ✅ | ✅ | Read-only DataTable |
| Admin: Xuất CSV | ✅ | ✅ | Node selector + date range |
| Admin: Telemetry Logs | ✅ | ✅ | Raw measurements + filter + realtime |
| Xếp hạng ô nhiễm | ✅ | ✅ | Sorted by AQI desc |
