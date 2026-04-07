# 📖 Tài liệu dự án — Hệ thống Giám sát Chất lượng Không khí Đô thị

Tài liệu kỹ thuật đầy đủ cho dự án đồ án tốt nghiệp.

---

## Mục lục

### 🏗️ Kiến trúc hệ thống (`architecture/`)
- [Tổng quan kiến trúc](architecture/system-overview.md) — Kiến trúc tổng thể, các thành phần, luồng dữ liệu
- [Luồng dữ liệu](architecture/data-flow.md) — Chi tiết luồng dữ liệu end-to-end (Node → Gateway → Server → Frontend)
- [Công nghệ sử dụng](architecture/tech-stack.md) — Danh sách công nghệ, thư viện và lý do lựa chọn

### 🗄️ Cơ sở dữ liệu (`database/`)
- [Thiết kế Schema](database/schema-design.md) — PostgreSQL + TimescaleDB + PostGIS: thiết kế bảng, Hypertable, Continuous Aggregates
- [Prisma Schema](database/prisma-schema.md) — Giải thích file `schema.prisma` và cách sử dụng Prisma ORM

### 🔌 Firmware (`firmware/`)
- [Sensor Node](firmware/sensor-node.md) — Firmware ESP32 sensor node: FreeRTOS tasks, drivers, quản lý năng lượng
- [Gateway](firmware/gateway.md) — Firmware ESP32 gateway: superloop, nhận LoRa, gửi HTTP POST
- [Giao thức LoRa](firmware/lora-protocol.md) — Thiết kế gói tin LoRa 18 bytes, cấu hình tần số, SF, Bandwidth
- [Module AS32-TTL-100](firmware/lora-module-as32.md) — Thông số module LoRa UART, pin mapping, chế độ hoạt động
- [Hướng dẫn lắp ráp phần cứng](firmware/hardware-assembly.md) — Sơ đồ nối dây, danh sách linh kiện, quy trình test

### 🖥️ Backend (`backend/`)
- [API Reference](backend/api-reference.md) — Tất cả REST API endpoints (User, Admin, Gateway)
- [Kiến trúc Server](backend/server-architecture.md) — Cấu trúc Express server, middleware, services
- [Tính toán AQI](backend/aqi-calculation.md) — Công thức AQI (US EPA), đánh giá CO₂, TVOC

### 🌐 Frontend (`frontend/`)
- [Kiến trúc Frontend](frontend/frontend-architecture.md) — Cấu trúc React 19 + Vite 6, routing, state management, i18n
- [UI Components](frontend/components.md) — Thư viện 10 UI components (DataTable, Modal, Badge...)

### ⚡ Tính năng (`features/`)
- [Chức năng hệ thống](features/system-features.md) — Danh sách đầy đủ các chức năng cho người dùng và quản trị

### 📚 Hướng dẫn (`guides/`)
- [Quick Start](guides/getting-started.md) — Bắt đầu nhanh trong 5 phút
- [Cài đặt môi trường phát triển](guides/development-setup.md) — Hướng dẫn chi tiết cài đặt đầy đủ
- [Triển khai Production](guides/deployment.md) — Hướng dẫn deploy lên VPS/Cloud

### 📋 Quản lý dự án (`project/`)
- [Timeline](project/timeline.md) — Kế hoạch 12 tuần (07/04 → 01/07/2026)
- [Danh sách linh kiện](project/component-list.md) — Bảng linh kiện, số lượng, chi phí ước tính

### 📄 Báo cáo & Slide
- `report/` — Báo cáo tiến độ tuần và báo cáo đồ án chính thức
- `slides/` — Slide thuyết trình bảo vệ

---

## Workflows

Các workflow phát triển được lưu tại `.agents/workflows/`:

| Workflow | Mô tả |
|----------|--------|
| [run-backend](../.agents/workflows/run-backend.md) | Khởi động backend server |
| [run-database](../.agents/workflows/run-database.md) | Khởi tạo và quản lý database |
| [flash-firmware](../.agents/workflows/flash-firmware.md) | Flash firmware lên ESP32 |
| [deploy](../.agents/workflows/deploy.md) | Triển khai production |
| [add-api-endpoint](../.agents/workflows/add-api-endpoint.md) | Thêm API endpoint mới |
