# 📋 Progress Tracker — Tiến độ dự án

> **Cập nhật lần cuối**: 07/04/2026  
> **Tiến độ tổng thể**: 🟩🟩⬜⬜⬜⬜⬜⬜⬜⬜ **~22%**

---

## Giai đoạn 1: Backend + Frontend User (Tuần 1–3 / 07–27/04) 🔴

### Tuần 1 (07–13/04): Backend CRUD API + Frontend Setup

#### Backend
- [x] API User: Dashboard AQI (`GET /stations/dashboard`)
- [x] API User: Trạm gần nhất (`GET /stations/nearest`)
- [x] API User: Lịch sử dữ liệu (`GET /stations/:id/history`)
- [x] API User: Thời tiết (`GET /weather`)
- [x] API Gateway: Nhận telemetry (`POST /telemetry`)
- [x] API Admin: Đăng nhập JWT (`POST /admin/login`)
- [x] API Admin: Liệt kê Gateways/Nodes (`GET /admin/gateways`, `GET /admin/nodes`)
- [x] API Admin: Xuất CSV (`GET /admin/export/measurements`)
- [x] API Admin: CRUD Gateway (Create/Update/Delete)
- [x] API Admin: CRUD Sensor Node (Create/Update/Delete)
- [x] API Admin: Cảnh báo (Alerts API)
- [x] API Admin: Cấu hình ngưỡng (Config API)

#### Frontend User
- [ ] Khởi tạo React + Vite
- [ ] Design System (colors, typography, components)
- [ ] Layout chính (Header, Sidebar, Content)
- [ ] Routing (`react-router-dom`)

### Tuần 2 (14–20/04): Dashboard User

- [ ] Dashboard: Cards thông số (AQI, PM2.5, PM10, CO₂, TVOC, Temp, Humidity)
- [ ] Dashboard: Bản đồ AQI (Leaflet) với markers mã màu
- [ ] Dashboard: Cảnh báo sức khỏe WHO
- [ ] Dashboard: Kết nối Socket.IO realtime
- [ ] Dashboard: Gợi ý trạm gần nhất (Geolocation API)
- [ ] Dashboard: Widget thời tiết (OpenWeatherMap)

### Tuần 3 (21–27/04): Biểu đồ + Chi tiết

- [ ] Trang Chi tiết Node: Hiển thị thông tin node
- [ ] Biểu đồ lịch sử: ECharts cột theo giờ/ngày
- [ ] Biểu đồ realtime: Cập nhật live qua Socket.IO
- [ ] Bộ lọc: Chọn thông số, khoảng thời gian

---

## Giai đoạn 2: Admin + Hardware (Tuần 4–6 / 28/04–18/05) 🔴

### Tuần 4 (28/04–04/05): Frontend Admin

- [ ] Trang Login Admin
- [ ] Layout Admin Dashboard (sidebar, header, content)
- [ ] Dashboard Admin: Tổng quan hệ thống (số gateway, nodes, uptime)

### Tuần 5 (05–11/05): CRUD thiết bị + Hardware

- [ ] Admin UI: Bảng danh sách Gateways (DataTable)
- [ ] Admin UI: Bảng danh sách Sensor Nodes (DataTable)
- [ ] Admin UI: Form thêm/sửa Gateway
- [ ] Admin UI: Form thêm/sửa Sensor Node
- [ ] Admin UI: Xóa thiết bị (với confirm dialog)
- [ ] Hardware: Lắp ráp Sensor Node hoàn chỉnh
- [ ] Hardware: Lắp ráp Gateway hoàn chỉnh
- [ ] Hardware: Test truyền LoRa indoor

### Tuần 6 (12–18/05): Health Monitor + LoRa Outdoor

- [ ] Admin UI: Health Monitor (trạng thái online/offline, RSSI, battery)
- [ ] Admin UI: Trang xuất CSV
- [ ] Hardware: Test LoRa outdoor (đo khoảng cách, packet loss)
- [ ] Hardware: Đo thời lượng pin thực tế

---

## Giai đoạn 3: Tích hợp (Tuần 7–8 / 19/05–01/06) 🔴

### Tuần 7 (19–25/05): Tích hợp HW ↔ Server

- [ ] Kết nối Sensor Node → Gateway → Server thực tế
- [ ] Dữ liệu thật hiển thị trên Dashboard
- [ ] Kiểm tra pipeline end-to-end
- [ ] Bắt đầu viết báo cáo đồ án

### Tuần 8 (26/05–01/06): Testing + Sửa bug

- [ ] Chạy hệ thống ổn định 24–48h
- [ ] Sửa bug Frontend/Backend
- [ ] Tối ưu performance (lazy loading, caching)
- [ ] Kiểm tra edge cases (mất kết nối, dữ liệu lỗi)

---

## Giai đoạn 4: Deploy + Dữ liệu thực (Tuần 9–10 / 02–15/06) 🟡

### Tuần 9 (02–08/06): Deploy Production

- [ ] Deploy backend lên VPS
- [ ] Cấu hình domain + HTTPS
- [ ] Deploy frontend (build + serve)
- [ ] Thu thập dữ liệu thực tế

### Tuần 10 (09–15/06): Hoàn thiện báo cáo

- [ ] Draft báo cáo hoàn chỉnh
- [ ] Hình ảnh, biểu đồ, bảng số liệu
- [ ] Review và chỉnh sửa báo cáo

---

## Giai đoạn 5: Tài liệu + Bảo vệ (Tuần 11–12 / 16/06–01/07) 🟡

### Tuần 11 (16–22/06): Slide + Demo

- [ ] Tạo slide thuyết trình
- [ ] Quay video demo hệ thống
- [ ] Chuẩn bị kịch bản bảo vệ

### Tuần 12 (23/06–01/07): Bảo vệ đồ án

- [ ] Tập thuyết trình
- [ ] **BẢO VỆ ĐỒ ÁN** 🎓

---

## Tóm tắt trạng thái

| Giai đoạn | Tiến độ | Trạng thái |
|---|---|---|
| GĐ 1: Backend + Frontend User | 12/26 | 🟡 Đang thực hiện |
| GĐ 2: Admin + Hardware | 0/13 | ⬜ Chưa bắt đầu |
| GĐ 3: Tích hợp | 0/8 | ⬜ Chưa bắt đầu |
| GĐ 4: Deploy + Dữ liệu | 0/7 | ⬜ Chưa bắt đầu |
| GĐ 5: Tài liệu + Bảo vệ | 0/5 | ⬜ Chưa bắt đầu |
