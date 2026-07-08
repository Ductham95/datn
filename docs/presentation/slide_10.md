# Slide 10: Backend — Kiến trúc phân lớp & Pipeline Telemetry

## ✅ Nội dung HIỆN trên slide (3 bullet chính)

- **Kiến trúc 3 lớp một chiều** — Routes → Controllers → Services → Config; phụ thuộc một chiều, kiểm thử từng lớp độc lập (2.732 LOC JavaScript)
- **Pipeline telemetry 3 bước** — ① Dedup (lọc trùng lặp qua `dedupCache`) → ② Transaction (cập nhật Gateway + Sensor Node + lưu `measurements`) → ③ Alert (kiểm tra ngưỡng **ngoài** transaction)
- **Zero data loss** — lỗi cảnh báo KHÔNG rollback dữ liệu đo; cooldown 15 phút chống spam; Socket.IO phát `new_telemetry_data` + `new-alert` realtime

## 🎤 Nội dung NÓI miệng khi trình bày

- Mở đầu: "Slide trước em đã trình bày firmware Sensor Node và Gateway, bây giờ em trình bày cách Backend Server — tầng máy chủ — xử lý dữ liệu nhận từ Gateway."
- Giải thích kiến trúc phân lớp: "Backend được tổ chức theo mô hình 3 lớp: lớp Controller tiếp nhận HTTP request, lớp Service chứa logic nghiệp vụ, và lớp Data Access tương tác với cơ sở dữ liệu thông qua Prisma ORM. Phụ thuộc tuân thủ chiều một hướng — lớp trên gọi lớp dưới, không ngược lại — giúp kiểm thử và bảo trì từng lớp độc lập."
- Giải thích pipeline telemetry: "Đây là luồng xử lý cốt lõi. Khi Gateway gửi HTTP POST chứa batch dữ liệu, Controller chuyển cho telemetryService. Bước 1: module dedupCache lọc gói tin trùng lặp — xử lý trường hợp nhiều Gateway cùng nhận một gói LoRa. Bước 2: một database transaction duy nhất cập nhật trạng thái Gateway, Sensor Node và ghi dữ liệu đo — ba thao tác này nằm chung transaction để đảm bảo nhất quán. Bước 3: alertService kiểm tra ngưỡng cảnh báo, nhưng bước này nằm NGOÀI transaction — nghĩa là nếu alertService bị lỗi, dữ liệu đo vẫn đã được lưu thành công. Đây là quyết định thiết kế quan trọng nhất — zero data loss."
- Giải thích realtime + alert: "Sau khi xử lý xong, Controller tính AQI qua aqiService và phát sự kiện Socket.IO để Frontend cập nhật tức thì. Nếu có cảnh báo mới, sự kiện new-alert cũng được phát. Cơ chế cooldown 15 phút ngăn tạo cảnh báo trùng lặp cho cùng thiết bị và thông số trong khoảng thời gian ngắn."
- Chuyển tiếp: "Với pipeline xử lý telemetry rõ ràng, slide tiếp theo em sẽ trình bày tầng cơ sở dữ liệu — cách TimescaleDB lưu trữ dữ liệu chuỗi thời gian và cách tính AQI."

## 🖼️ Hình ảnh / Bảng biểu

- **Hình (cho slide):** `drawio/seq_telemetry_pipeline_simple.drawio` — Biểu đồ trình tự **đơn giản hoá** (4 lifeline, 6 bước) — xuất PNG để dùng
- **Hình gốc (báo cáo):** `Hinhve/seq_telemetry_ingestion.png` — phiên bản chi tiết đầy đủ
- **Hình thay thế:** `Hinhve/module_backend_services.png` — Biểu đồ quan hệ module Backend (nếu muốn nhấn mạnh kiến trúc thay vì luồng)
- **Caption:** Pipeline xử lý telemetry — zero data loss

## 📐 Bố cục đề xuất (2 cột: bullet trái + biểu đồ trình tự phải)

```
┌──────────────────────────────────────────────────────┐
│  [Tiêu đề] Backend — Pipeline Telemetry              │
├────────────────────────┬─────────────────────────────┤
│                        │                             │
│  🏗️ Kiến trúc 3 lớp    │  [seq_telemetry_ingestion]  │
│  Routes → Controllers  │                             │
│  → Services → Config   │  Gateway ──HTTP──→ Controller│
│                        │       │                     │
│  ⚙️ Pipeline 3 bước    │  ① dedupCache (lọc trùng)   │
│  ① Dedup               │       │                     │
│  ② Transaction (DB)    │  ② Transaction ──→ DB       │
│  ③ Alert (ngoài TX)    │       │                     │
│                        │  ③ alertService (ngoài TX)  │
│  🛡️ Zero data loss     │       │                     │
│  • Lỗi alert ≠ mất dữ │  Socket.IO ──→ Frontend     │
│    liệu đo             │                             │
│  • Cooldown 15 phút    │                             │
│                        │                             │
├────────────────────────┴─────────────────────────────┤
│  Nguồn: §4.2.4, §5.3 báo cáo                 (nhỏ) │
└──────────────────────────────────────────────────────┘
```

## 🎨 Mẹo thiết kế

- Dùng **3 icon số thứ tự** (①②③) với **màu gradient** cho 3 bước pipeline: xanh dương → xanh lá → cam
- Bold **"Zero data loss"** cỡ lớn, dùng **màu xanh lá đậm** kèm icon 🛡️ để nhấn mạnh tính bảo toàn dữ liệu
- Biểu đồ trình tự bên phải nên **highlight vùng Transaction** bằng khung nền xanh nhạt và vùng **Alert ngoài Transaction** bằng khung nền cam nhạt — tạo tương phản trực quan giữa "trong TX" và "ngoài TX"
- Số **2.732 LOC** hiển thị nhỏ dạng badge bên cạnh tiêu đề Backend
- Dùng mũi tên **một chiều** cho kiến trúc phân lớp để nhấn mạnh nguyên tắc phụ thuộc

## 📎 Nguồn tham chiếu

- File: `4_Ket_qua_thuc_nghiem.tex`, Section: §4.2.4 (Thiết kế module Backend — telemetryService, aqiService, alertService, stationService)
- File: `5_Giai_phap_dong_gop.tex`, Section: §5.3 (Kiến trúc Backend phân lớp và pipeline xử lý telemetry)
- Hình tham chiếu: `fig:seq_telemetry` (Biểu đồ trình tự xử lý dữ liệu Telemetry), `fig:4_1_3_module_backend_services` (Biểu đồ quan hệ module Backend)
- Bảng tham chiếu: `table:stats` — Backend Server: 2.732 LOC JavaScript
