# Slide 06: Kiến trúc tổng thể hệ thống

## ✅ Nội dung HIỆN trên slide (4 tầng kiến trúc)

- **Tầng Cảm biến (Sensor Layer)** — ESP32 + 3 cảm biến + LoRa 433 MHz → gói tin nhị phân 18 byte
- **Tầng Trung chuyển (Gateway Layer)** — ESP32 + WiFi, mô hình Hub-Spoke → HTTP POST (JSON batch)
- **Tầng Máy chủ (Server Layer)** — Node.js/Express + TimescaleDB/PostGIS + Docker → xử lý, lưu trữ, tính AQI
- **Tầng Hiển thị (Presentation Layer)** — React SPA + Socket.IO → dashboard realtime + admin panel

## 🎤 Nội dung NÓI miệng khi trình bày

- Mở đầu: "Để hiện thực hóa 5 mục tiêu trên, em thiết kế hệ thống theo kiến trúc bốn tầng, mỗi tầng có trách nhiệm rõ ràng và phát triển độc lập."
- Giải thích tầng cảm biến: "Tầng dưới cùng là Sensor Node — mỗi node gồm ESP32 kết nối 3 cảm biến đo 6 thông số, dữ liệu được đóng gói thành gói nhị phân chỉ 18 byte và phát qua sóng LoRa 433 MHz, không cần WiFi tại điểm đo."
- Giải thích tầng trung chuyển: "Gateway đóng vai trò cầu nối — nhận gói LoRa từ nhiều Sensor Node theo mô hình Hub-Spoke, lưu vào bộ đệm vòng rồi gửi lên server qua WiFi dưới dạng HTTP POST."
- Giải thích tầng máy chủ: "Backend Server chạy Node.js, xử lý dữ liệu telemetry, tính AQI theo chuẩn US EPA, lưu vào TimescaleDB — một extension chuyên biệt cho dữ liệu chuỗi thời gian. Toàn bộ được đóng gói Docker."
- Giải thích tầng hiển thị: "Cuối cùng, giao diện web React nhận dữ liệu realtime qua Socket.IO, hiển thị dashboard cho người dùng và trang quản trị cho admin."
- Nhấn mạnh ưu điểm: "Kiến trúc 4 tầng cho phép mở rộng theo chiều ngang — ví dụ thêm Sensor Node mới mà không cần thay đổi Backend, và mỗi tầng hoạt động độc lập."
- Chuyển tiếp: "Slide tiếp theo em sẽ trình bày chi tiết tầng cảm biến — phần cứng và các cảm biến được sử dụng."

## 🖼️ Hình ảnh / Bảng biểu

- **Hình:** `Hinhve/system-architecture-simple.png`
- **Caption:** Kiến trúc 4 tầng của hệ thống

## 📐 Bố cục đề xuất (2 cột: text trái + sơ đồ phải)

```
┌──────────────────────────────────────────────────────┐
│  [Tiêu đề] Kiến trúc tổng thể hệ thống              │
├───────────────────────┬──────────────────────────────┤
│                       │                              │
│  • Tầng Cảm biến     │  [Sơ đồ kiến trúc 4 tầng    │
│    ESP32 + LoRa 18B   │   system-architecture-       │
│                       │   simple.png]                │
│  • Tầng Trung chuyển  │                              │
│    Hub-Spoke → HTTP   │  Sensor Node                 │
│                       │    ↓ LoRa 433MHz             │
│  • Tầng Máy chủ      │  Gateway                     │
│    Node.js + TSDB     │    ↓ HTTP POST               │
│                       │  Backend + TimescaleDB       │
│  • Tầng Hiển thị     │    ↓ Socket.IO               │
│    React + Socket.IO  │  Frontend (React SPA)        │
│                       │                              │
├───────────────────────┴──────────────────────────────┤
│  Nguồn: §3.1, §4.1 báo cáo                  (nhỏ)  │
└──────────────────────────────────────────────────────┘
```

## 🎨 Mẹo thiết kế

- Hình sơ đồ kiến trúc chiếm **50–60%** bên phải, 4 bullet ngắn bên trái
- Mỗi tầng dùng **1 màu riêng biệt** để phân biệt trực quan:
  - Tầng Cảm biến: xanh lá (phần cứng, IoT)
  - Tầng Trung chuyển: cam (bridge, chuyển tiếp)
  - Tầng Máy chủ: xanh dương (backend, server)
  - Tầng Hiển thị: tím (frontend, UI)
- Giữa các tầng ghi rõ **giao thức kết nối**: LoRa 433 MHz → HTTP POST → Socket.IO
- Bold tên giao thức (LoRa, HTTP, Socket.IO) và công nghệ chính (ESP32, Node.js, TimescaleDB, React)
- Dùng mũi tên xuống (↓) thể hiện luồng dữ liệu một chiều từ cảm biến đến giao diện

## 📎 Nguồn tham chiếu

- File: `3_Cong_nghe.tex`, Section: §3.1 (Kiến trúc tổng thể hệ thống)
- File: `4_Ket_qua_thuc_nghiem.tex`, Section: §4.1 (Thiết kế kiến trúc — Lựa chọn kiến trúc phần mềm)
- Hình tham chiếu: `fig:kien_truc_tong_the` (Hình 3.1 trong báo cáo)
