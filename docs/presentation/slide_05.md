# Slide 05: Mục tiêu đề tài

## ✅ Nội dung HIỆN trên slide (5 mục tiêu + 1 highlight)

- **① Thu thập 6 thông số** — PM2.5, PM10, CO₂, TVOC, nhiệt độ, độ ẩm từ cảm biến chi phí thấp
- **② Truyền LoRa tầm xa** — không cần WiFi/4G tại từng điểm đo
- **③ Xử lý & tính AQI** — lưu trữ chuỗi thời gian, tính AQI chuẩn US EPA
- **④ Dashboard realtime** — bản đồ AQI, biểu đồ lịch sử, xếp hạng ô nhiễm
- **⑤ Admin panel** — quản lý thiết bị, cảnh báo, cấu hình, xuất dữ liệu
- 🔓 **Mã nguồn mở 100%** — cho phép tái sử dụng, tùy biến, mở rộng

## 🎤 Nội dung NÓI miệng khi trình bày

- Mở đầu: "Từ khoảng trống đã phân tích, em xác định 5 mục tiêu cụ thể cho hệ thống."
- Giải thích thứ tự: "Thứ nhất, hệ thống phải đo được đa thông số — không chỉ bụi mịn mà cả CO₂, TVOC, nhiệt độ và độ ẩm — để phản ánh toàn diện chất lượng không khí."
- Nhấn mạnh LoRa: "Thứ hai, điểm khác biệt lớn nhất so với các giải pháp hiện có là sử dụng LoRa để truyền dữ liệu tầm xa, loại bỏ yêu cầu WiFi/4G tại mỗi điểm đo."
- Giải thích AQI: "Thứ ba, dữ liệu thô từ cảm biến sẽ được xử lý và quy đổi sang chỉ số AQI theo chuẩn US EPA — đây là chuẩn được quốc tế công nhận rộng rãi."
- Dashboard + Admin: "Hai mục tiêu cuối hướng đến hai đối tượng sử dụng: người dân xem dashboard theo thời gian thực, và quản trị viên quản lý toàn bộ hệ thống."
- Nhấn mạnh open-source: "Quan trọng, toàn bộ mã nguồn được công khai trên GitHub, cho phép cộng đồng và các tổ chức tái sử dụng hoàn toàn."
- Chuyển tiếp: "Để hiện thực hóa 5 mục tiêu này, em thiết kế hệ thống theo kiến trúc 4 tầng — sẽ trình bày ở slide tiếp theo."

## 🖼️ Hình ảnh / Bảng biểu

- **Hình:** Infographic 5 mục tiêu dạng icon — mỗi mục tiêu 1 icon tượng trưng:
  - ① Cảm biến (icon chip/sensor)
  - ② Ăng-ten LoRa (icon sóng radio)
  - ③ AQI (icon biểu đồ/dashboard nhỏ)
  - ④ Màn hình web (icon monitor + bản đồ)
  - ⑤ Bảng quản trị (icon gear/settings)
  - 🔓 Open-source (icon GitHub/mã nguồn)
- **Caption:** 5 chức năng chính + mã nguồn mở

## 📐 Bố cục đề xuất (2 cột: icon trái + text phải)

```
┌──────────────────────────────────────────────────────┐
│  [Tiêu đề] Mục tiêu đề tài                          │
├──────────────────────┬───────────────────────────────┤
│                      │                               │
│  [INFOGRAPHIC        │  ① Thu thập 6 thông số        │
│   5 icon xếp dọc    │  ② Truyền LoRa tầm xa        │
│   + icon open-src    │  ③ Xử lý & tính AQI          │
│   bên trái]          │  ④ Dashboard realtime         │
│                      │  ⑤ Admin panel                │
│                      │  🔓 Mã nguồn mở 100%         │
│                      │                               │
├──────────────────────┴───────────────────────────────┤
│  Nguồn: §1.2 báo cáo                        (nhỏ)  │
└──────────────────────────────────────────────────────┘
```

Hoặc **layout dọc** (nếu muốn icon nổi bật hơn):

```
┌──────────────────────────────────────────────────────┐
│  [Tiêu đề] Mục tiêu đề tài                          │
├──────────────────────────────────────────────────────┤
│                                                      │
│  🔲 Thu thập    🔲 LoRa     🔲 AQI                  │
│     6 thông số     tầm xa      US EPA                │
│                                                      │
│       🔲 Dashboard       🔲 Admin panel              │
│          realtime           quản trị                  │
│                                                      │
│            ┌─────────────────────────┐               │
│            │ 🔓 MÃ NGUỒN MỞ 100%   │               │
│            └─────────────────────────┘               │
│                                                      │
├──────────────────────────────────────────────────────┤
│  Nguồn: §1.2 báo cáo                        (nhỏ)  │
└──────────────────────────────────────────────────────┘
```

## 🎨 Mẹo thiết kế

- Dùng **5 icon tròn** cùng kích thước, mỗi icon kèm label ngắn bên dưới — tạo cảm giác hệ thống, có kế hoạch rõ ràng
- Mỗi icon dùng **1 màu accent riêng** (xanh dương = sensor, xanh lá = LoRa, cam = AQI, tím = dashboard, hồng = admin) để phân biệt trực quan
- Dòng **"Mã nguồn mở 100%"** dùng nền xanh lá đậm + chữ trắng, icon GitHub bên trái — đây là USP nổi bật nhất
- Số circled (①②③④⑤) tạo cảm giác trình tự logic, dễ theo dõi
- Font size: tiêu đề cỡ lớn, 5 bullet cỡ vừa, dòng open-source cỡ lớn hơn bullet để nhấn mạnh
- Không cần bảng biểu — slide này nên thoáng, visual-driven

## 📎 Nguồn tham chiếu

- File: `1_Gioi_thieu.tex`, Section: §1.2 (Mục tiêu và phạm vi đề tài)
- Trích dẫn: `\cite{usepa2018}`, `\cite{augustin2016}`, `\cite{morawska2018}`
