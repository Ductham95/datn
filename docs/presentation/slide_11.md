# Slide 11: Cơ sở dữ liệu & Tính AQI

## ✅ Nội dung HIỆN trên slide (3 bullet chính)

- **PostgreSQL + 2 extension** — 7 bảng + 1 materialized view; TimescaleDB (hypertable tự phân mảnh, Continuous Aggregate, Retention Policy 3 tháng) + PostGIS (truy vấn trạm gần nhất qua `ST_DistanceSphere`)
- **Hypertable `measurements`** — khóa chính composite `(time, node_id)`; 6 thông số (PM2.5, PM10, CO₂, TVOC, nhiệt độ, độ ẩm); `hourly_measurements` Continuous Aggregate tự động tính trung bình/giờ
- **AQI US EPA — nội suy tuyến tính** — công thức: Iₚ = (I_Hi − I_Lo)/(BP_Hi − BP_Lo) × (Cₚ − BP_Lo) + I_Lo; AQI tổng hợp = max(I_PM2.5, I_PM10) → 6 mức mã màu (Xanh → Nâu đỏ)

## 🎤 Nội dung NÓI miệng khi trình bày

- Mở đầu: "Slide trước em đã trình bày pipeline xử lý telemetry trên Backend. Bây giờ em trình bày tầng cơ sở dữ liệu — cách hệ thống lưu trữ dữ liệu chuỗi thời gian và tính chỉ số AQI."
- Giải thích CSDL: "CSDL sử dụng PostgreSQL 15 với hai extension. TimescaleDB chuyển bảng measurements thành hypertable — tự động phân mảnh theo thời gian, giúp tối ưu hiệu năng ghi và truy vấn khi dữ liệu tăng liên tục. Continuous Aggregate hourly_measurements tự động tính giá trị trung bình theo giờ — nhờ đó khi người dùng xem lịch sử 30 ngày, hệ thống truy vấn view đã tính sẵn thay vì tính từ dữ liệu thô, đáp ứng yêu cầu phản hồi dưới 3 giây. Retention Policy tự động xóa dữ liệu thô quá 3 tháng để kiểm soát dung lượng."
- Giải thích PostGIS: "PostGIS bổ sung kiểu dữ liệu không gian cho cột geom của bảng sensor_nodes — lưu toạ độ GPS theo chuẩn WGS84. Khi người dùng mở Dashboard, hệ thống gọi hàm ST_DistanceSphere để tìm trạm đo gần nhất dựa trên vị trí GPS của trình duyệt."
- Giải thích AQI: "Hệ thống tính AQI theo chuẩn US EPA. Với mỗi chất ô nhiễm dạng hạt — PM2.5 và PM10 — em tra bảng breakpoint để tìm khoảng nồng độ chứa giá trị đo, sau đó áp dụng công thức nội suy tuyến tính. AQI tổng hợp lấy giá trị lớn nhất giữa AQI PM2.5 và AQI PM10, sau đó ánh xạ sang 6 mức mã màu từ Xanh lá — Tốt đến Nâu đỏ — Nguy hiểm. Module aqiService triển khai thuật toán này và đã được kiểm thử 19/19 unit test đạt."
- Chuyển tiếp: "Với CSDL và AQI đã rõ, slide tiếp theo em sẽ demo giao diện người dùng — nơi hiển thị kết quả của toàn bộ pipeline."

## 🖼️ Hình ảnh / Bảng biểu

- **Hình:** `Hinhve/er_database.png` — Biểu đồ thực thể–quan hệ (ERD) 7 bảng
- **Bảng (đơn giản hoá):**

| AQI | Mức độ | Mã màu |
|-----|--------|--------|
| 0–50 | Tốt (Good) | 🟢 Xanh lá |
| 51–100 | Trung bình (Moderate) | 🟡 Vàng |
| 101–150 | Nhóm nhạy cảm | 🟠 Cam |
| 151–200 | Có hại (Unhealthy) | 🔴 Đỏ |
| 201–300 | Rất có hại | 🟣 Tím |
| 301–500 | Nguy hiểm (Hazardous) | 🟤 Nâu đỏ |

- **Công thức:** Iₚ = (I_Hi − I_Lo) / (BP_Hi − BP_Lo) × (Cₚ − BP_Lo) + I_Lo
- **Caption:** ERD hệ thống — 7 bảng + 1 materialized view

## 📐 Bố cục đề xuất (2 cột: ERD trái + bullet phải, bảng AQI dưới)

```
┌──────────────────────────────────────────────────────┐
│  [Tiêu đề] Cơ sở dữ liệu & Tính AQI                │
├─────────────────────────┬────────────────────────────┤
│                         │                            │
│  [er_database.png]      │  🗄️ PostgreSQL + 2 ext     │
│                         │  • TimescaleDB: hypertable │
│  7 bảng + 1 mat. view   │    + Continuous Aggregate  │
│                         │    + Retention 3 tháng     │
│                         │  • PostGIS: ST_Distance    │
│                         │                            │
│                         │  📊 AQI = max(I_PM2.5,     │
│                         │          I_PM10)           │
│                         │  Iₚ = ... (công thức)      │
├─────────────────────────┴────────────────────────────┤
│  [Bảng AQI 6 mức — 1 dòng ngang, mã màu nổi bật]   │
├──────────────────────────────────────────────────────┤
│  Nguồn: §4.2.5, §3.6 báo cáo                 (nhỏ) │
└──────────────────────────────────────────────────────┘
```

## 🎨 Mẹo thiết kế

- ERD chiếm **50% bên trái**, highlight bảng `measurements` (hypertable) bằng **viền xanh dương đậm** và bảng `sensor_nodes` (cột `geom` PostGIS) bằng **viền xanh lá**
- Công thức AQI hiển thị **cỡ lớn**, dùng font toán học, bold các biến Iₚ và Cₚ
- Bảng 6 mức AQI hiển thị dạng **thanh gradient ngang** (strip) ở cuối slide: mỗi ô một màu liền kề, text trắng trên nền màu — giống chuẩn US EPA
- Số **19/19 test pass** hiển thị nhỏ dạng badge ✅ bên cạnh công thức AQI để nhấn mạnh tính chính xác
- Dùng icon 🗄️ cho database và 📊 cho AQI để phân biệt hai phần nội dung

## 📎 Nguồn tham chiếu

- File: `4_Ket_qua_thuc_nghiem.tex`, Section: §4.2.5 (Thiết kế cơ sở dữ liệu — 7 bảng + 1 materialized view, TimescaleDB, PostGIS)
- File: `3_Cong_nghe.tex`, Section: §3.6 (Lý thuyết tính toán AQI — công thức nội suy, bảng breakpoint, 6 mức mã màu)
- Hình tham chiếu: `fig:er_diagram` (Biểu đồ thực thể–quan hệ ERD)
- Bảng tham chiếu: `table:aqi_levels` (6 mức AQI), `table:bp_pm25`, `table:bp_pm10` (bảng breakpoint)
- Công thức tham chiếu: Công thức (3.1) — eq:aqi
