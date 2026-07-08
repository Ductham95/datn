# Slide 07: Phần cứng & Cảm biến

## ✅ Nội dung HIỆN trên slide (3 bullet + 1 bảng)

- **ESP32 DevKit V1** — vi điều khiển 2 nhân 240 MHz, WiFi + BLE, SRAM 520 KB, hỗ trợ UART/I2C/ADC
- **Module LoRa AS32-TTL-100** — chip SX1278, 433 MHz ISM, công suất 20 dBm, khoảng cách 3–5 km (đô thị), giao tiếp UART transparent
- **3 cảm biến → 6 thông số** — tổng chi phí linh kiện cảm biến ~535.000 VNĐ

| Cảm biến | Thông số đo | Giao tiếp | Chi phí |
|----------|-------------|-----------|---------|
| PMS7003 | PM2.5, PM10 | UART | ~350K VNĐ |
| CCS811 | eCO₂, eTVOC | I2C | ~150K VNĐ |
| AHT10 | Nhiệt độ, Độ ẩm | I2C | ~35K VNĐ |

## 🎤 Nội dung NÓI miệng khi trình bày

- Mở đầu: "Tiếp theo, em trình bày chi tiết tầng cảm biến — phần cứng và các module cảm biến được sử dụng trong Sensor Node."
- Giải thích ESP32: "Em chọn ESP32 vì tích hợp sẵn WiFi (cần cho provisioning qua web) và đầy đủ giao tiếp ngoại vi UART, I2C. So với Arduino Mega thì không có WiFi, Raspberry Pi thì chi phí cao gấp 3–5 lần và tiêu thụ năng lượng lớn, không phù hợp cho node chạy pin."
- Giải thích LoRa module: "Module AS32-TTL-100 dựa trên chip SX1278 của Semtech, hoạt động ở chế độ transparent — firmware chỉ cần ghi dữ liệu vào UART, module tự điều chế và phát sóng LoRa, đơn giản hóa đáng kể so với dùng SX1278 trực tiếp qua SPI."
- Giải thích cảm biến: "PMS7003 đo bụi mịn bằng nguyên lý tán xạ laser, CCS811 đo CO₂ và TVOC bằng công nghệ oxit kim loại MOX, AHT10 đo nhiệt độ và độ ẩm. CCS811 và AHT10 chia sẻ chung bus I2C, giảm số chân GPIO cần sử dụng."
- Nhấn mạnh chi phí: "Tổng chi phí 3 cảm biến chỉ khoảng 535.000 VNĐ — đây là ưu điểm quan trọng so với các giải pháp thương mại như IQAir có giá hàng triệu đồng."
- Giải thích sơ đồ mạch: "Sensor Node kết nối 4 module qua 3 giao tiếp: LoRa qua UART1, PMS7003 qua UART2, CCS811 + AHT10 + OLED qua bus I2C. Pin 18650 được đo qua mạch phân áp nối vào ADC."
- Chuyển tiếp: "Slide tiếp theo em sẽ trình bày cách dữ liệu từ các cảm biến này được đóng gói thành gói tin LoRa nhị phân 18 byte."

## 🖼️ Hình ảnh / Bảng biểu

- **Hình:** `Hinhve/schematic_sensor_node.png`
- **Bảng:** Bảng thông số cảm biến (markdown ở trên) — rút gọn từ Bảng 3.2 báo cáo
- **Caption:** Sơ đồ mạch Sensor Node

## 📐 Bố cục đề xuất (bảng trên + sơ đồ mạch dưới)

```
┌──────────────────────────────────────────────────────┐
│  [Tiêu đề] Phần cứng & Cảm biến                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  • ESP32 DevKit V1 — 2 nhân 240MHz, WiFi, UART/I2C  │
│  • LoRa AS32-TTL-100 — SX1278, 433MHz, 3–5 km       │
│  • 3 cảm biến → 6 thông số (~535K VNĐ)              │
│                                                      │
│  ┌──────────┬────────────┬──────────┬────────┐       │
│  │ Cảm biến │ Thông số   │ Giao tiếp│Chi phí │       │
│  ├──────────┼────────────┼──────────┼────────┤       │
│  │ PMS7003  │ PM2.5,PM10 │ UART     │ 350K   │       │
│  │ CCS811   │ eCO₂,eTVOC│ I2C      │ 150K   │       │
│  │ AHT10    │ Nhiệt,Ẩm  │ I2C      │  35K   │       │
│  └──────────┴────────────┴──────────┴────────┘       │
│                                                      │
├──────────────────────────────────────────────────────┤
│  [Sơ đồ mạch Sensor Node — schematic_sensor_node]   │
│  (chiếm ~45% diện tích slide)                        │
│                                                      │
├──────────────────────────────────────────────────────┤
│  Nguồn: §3.2, §4.2.1 báo cáo                 (nhỏ) │
└──────────────────────────────────────────────────────┘
```

Lưu ý: Nếu slide quá chật, có thể chuyển sang layout **2 cột** (bảng + bullet trái, sơ đồ mạch phải):

```
┌──────────────────────────────────────────────────────┐
│  [Tiêu đề] Phần cứng & Cảm biến                     │
├────────────────────────┬─────────────────────────────┤
│  • ESP32 DevKit V1     │                             │
│  • LoRa AS32-TTL-100   │  [Sơ đồ mạch               │
│  • 3 cảm biến          │   schematic_sensor_node.png]│
│                        │                             │
│  ┌────┬──────┬────┬──┐ │                             │
│  │PMS │PM2.5 │UART│35│ │                             │
│  │CCS │CO₂   │I2C │15│ │                             │
│  │AHT │T,H   │I2C │ 3│ │                             │
│  └────┴──────┴────┴──┘ │                             │
├────────────────────────┴─────────────────────────────┤
│  Nguồn: §3.2, §4.2.1 báo cáo                 (nhỏ) │
└──────────────────────────────────────────────────────┘
```

## 🎨 Mẹo thiết kế

- Bold số **535.000 VNĐ** cỡ lớn bên cạnh bảng, dùng màu xanh lá để nhấn mạnh "chi phí thấp"
- Bảng cảm biến dùng **nền xen kẽ** (striped rows) để dễ đọc
- Mỗi cảm biến có thể kèm **icon nhỏ** (bụi/khí/nhiệt kế) để trực quan
- Sơ đồ mạch highlight **3 giao tiếp** bằng 3 màu: UART1 (cam), UART2 (xanh dương), I2C (xanh lá)
- Tên module (ESP32, PMS7003, CCS811, AHT10, AS32-TTL-100) luôn bold

## 📎 Nguồn tham chiếu

- File: `3_Cong_nghe.tex`, Section: §3.2 (Nền tảng phần cứng IoT — ESP32, Module cảm biến)
- File: `3_Cong_nghe.tex`, Section: §3.3.2 (Module AS32-TTL-100)
- File: `4_Ket_qua_thuc_nghiem.tex`, Section: §4.2.1 (Thiết kế phần cứng — Sensor Node)
- Bảng tham chiếu: Bảng 3.2 (`table:so_sanh_cam_bien`) — Thông số kỹ thuật các cảm biến
- Hình tham chiếu: `fig:4_2_1_schematic_sensor_node` (Hình 4.2 trong báo cáo)
