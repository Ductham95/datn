# Slide 15: Thực nghiệm thực tế

## ✅ Nội dung HIỆN trên slide (4 bullet chính)

- **Kịch bản khói hương** — PM2.5 tăng từ 18 → 416 µg/m³ trong 1 phút (×20 lần), AQI chuyển "Nguy hại"; phục hồi về 41 µg/m³ sau 5 phút mở cửa
- **Đo đạc đa môi trường** — 3 môi trường: ven đường (PM2.5 ~22, eCO₂ đỉnh 1585 ppm), phòng khách (PM2.5 ~15, ổn định), bếp nấu ăn (eCO₂ đỉnh 1528 ppm, PM2.5 không tăng đáng kể)
- **Pin & Deep-sleep** — Pin 18650/1500 mAh, chu kỳ 30 phút → hoạt động liên tục **20,5 giờ** (~41 lần đo)
- **Khoảng cách LoRa** — Đạt **800 m** trong không gian thoáng (line-of-sight), module AS32-TTL-100 @ 433 MHz

## 🎤 Nội dung NÓI miệng khi trình bày

- Mở đầu: "Tiếp theo slide kiểm thử và triển khai, em xin trình bày kết quả thực nghiệm thực tế."
- Giải thích khói hương: "Em thực hiện thử nghiệm trong phòng kín 15 m²: pha Baseline 5 phút các chỉ số ổn định, pha đốt hương PM2.5 tăng vọt từ 18 lên đỉnh 416 µg/m³ chỉ trong 1 phút — AQI chuyển sang mức Nguy hại (nâu đỏ). Pha phục hồi sau khi mở cửa, PM2.5 giảm về 41 µg/m³ trong 5 phút. Toàn bộ thay đổi được Dashboard cập nhật real-time qua WebSocket."
- Giải thích đa môi trường: "Em cũng đo tại 3 môi trường khác nhau. Ven đường giao thông PM2.5 trung bình khoảng 22, nhưng eCO₂ và eTVOC dao động rất mạnh theo luồng xe. Phòng khách trong nhà có chất lượng không khí tốt nhất. Bếp nấu ăn thì eCO₂ đỉnh 1528 ppm nhưng PM2.5 hầu như không tăng — cho thấy nếu chỉ đo PM2.5 sẽ bỏ sót ô nhiễm khí."
- Giải thích pin: "Với board DevKit V1 và pin 18650 dung lượng 1500 mAh, chu kỳ deep-sleep 30 phút, Sensor Node hoạt động được 20,5 giờ — khoảng 41 lần đo. Thời gian bị hạn chế do board phát triển tiêu thụ dòng rò khoảng 26 mA. Nếu dùng bare ESP32 module thì giảm xuống 1,5 mA và kéo dài gấp nhiều lần."
- Giải thích LoRa: "Khoảng cách truyền LoRa đạt 800 mét trong không gian thoáng, tương đương khoảng 27% tầm phủ công bố. Kết quả này xác nhận mô hình Hub-Spoke: 1 Gateway phục vụ nhiều Sensor Node trong bán kính 500–800 mét."
- Chuyển tiếp: "Slide tiếp theo em sẽ tổng hợp các đóng góp chính của đồ án."

## 🖼️ Hình ảnh / Bảng biểu

- **Hình:** `thuc_nghiem_dot_huong_setup.jpg` — ảnh bố trí thiết bị thử nghiệm khói hương
- **Bảng:** So sánh tổng hợp 3 môi trường (rút gọn từ Bảng 4.17 trong báo cáo)

| Môi trường | PM2.5 | eCO₂ | eTVOC | AQI |
|------------|-------|------|-------|-----|
| Ven đường | 22,0 | 844,5 | 70,8 | 72 |
| Phòng khách | 15,1 | 451,3 | 7,4 | 57 |
| Bếp (đang nấu) | 16,1 | 1010,7 | 94,8 | 59 |

- **Caption bảng:** So sánh giá trị trung bình giữa 3 môi trường đo
- **Hình phụ (nếu đủ chỗ):** `thuc_nghiem_onhiem_dashboard.jpg` — Dashboard khi AQI mức Nguy hại

## 📐 Bố cục đề xuất (2 cột: bullet + bảng/hình)

```
┌──────────────────────────────────────────────────────┐
│  [Tiêu đề] Thực nghiệm thực tế                      │
├──────────────────────────┬───────────────────────────┤
│  🔥 Khói hương            │  [thuc_nghiem_dot_huong   │
│  • PM2.5: 18 → 416 (×20) │   _setup.jpg]             │
│  • Phục hồi: 5 phút      │                           │
│                          │  ──────────────────────── │
│  📊 Đa môi trường         │  [Bảng so sánh 3 MT]     │
│  • Ven đường / Nhà / Bếp │  Ven đường | Nhà | Bếp   │
│                          │                           │
│  🔋 Pin: 20,5h (1500mAh) │                           │
│  📡 LoRa: 800m (outdoor)  │                           │
├──────────────────────────┴───────────────────────────┤
│  Nguồn: §4.5.1 — Kết quả vận hành thực tế           │
└──────────────────────────────────────────────────────┘
```

## 🎨 Mẹo thiết kế

- Số **416 µg/m³** và **×20** dùng cỡ lớn, màu đỏ/nâu đỏ (tương ứng AQI Hazardous) để gây ấn tượng mạnh
- Số **20,5 giờ** và **800 m** bold màu xanh dương để highlight kết quả tích cực
- Bảng so sánh 3 môi trường: dùng nền vàng nhạt cho dòng ven đường (AQI 72 = Moderate), xanh nhạt cho phòng khách (AQI 57)
- Ảnh `thuc_nghiem_dot_huong_setup.jpg` có viền bo góc, shadow nhẹ, chiếm ~40% phải slide
- Dùng icon 🔥📊🔋📡 bên cạnh mỗi keyword để dễ phân biệt 4 kịch bản
- Giữ style nhất quán với slide 14: dark theme, keyword ngắn gọn, số liệu nổi bật

## 📎 Nguồn tham chiếu

- File: `4_Ket_qua_thuc_nghiem.tex`, Section: §4.5.1 (Kết quả vận hành thực tế)
- Kịch bản mất kết nối: Bước 1–4, Hình `fig:tkmkn_01` → `fig:tkmkn_10`
- Kịch bản khói hương: Bảng `table:thuc_nghiem_dot_huong`, Hình `fig:thuc_nghiem_dot_huong_setup`, `fig:thuc_nghiem_onhiem_dashboard`
- Kịch bản pin: Bảng `table:pin_thucnghiem` — 20,5 giờ với 18650/1500 mAh, deep-sleep 30 phút
- Kịch bản LoRa: Bảng `table:lora_range` — 800 m outdoor, module AS32-TTL-100 @ 433 MHz
- Kịch bản đa môi trường: Bảng `table:so_sanh_moi_truong` — 3 MT: ven đường, phòng khách, bếp
