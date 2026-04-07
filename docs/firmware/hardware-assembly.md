# Hardware Assembly — Hướng dẫn Lắp ráp Phần cứng

## 1. Danh sách linh kiện

| STT | Linh kiện | SL | Ghi chú |
|---|---|---|---|
| 1 | ESP32 DevKit V1 | 4 | 3 sensor node + 1 gateway |
| 2 | Module LoRa AS32-TTL-100 | 4 | UART, 433MHz |
| 3 | Anten LoRa 433MHz + dây pigtail | 4 | **BẮT BUỘC** |
| 4 | Cảm biến PMS7003 + adapter board | 3 | Cáp ribbon đi kèm |
| 5 | Cảm biến CCS811 breakout board | 3 | Adafruit hoặc CJMCU |
| 6 | Cảm biến DHT22 | 3 | Loại 3 chân (breakout board) |
| 7 | Pin 18650 + đế pin | 3 | Lithium 3.7V, ≥2500mAh |
| 8 | Module sạc TP4056 | 3 | Có mạch bảo vệ |
| 9 | Điện trở 10KΩ | 3 | Pull-up cho DHT22 |
| 10 | Điện trở 100KΩ | 6 | Voltage divider (2/node) |
| 11 | Breadboard 830 lỗ | 4 | Hoặc PCB đục lỗ |
| 12 | Dây jumper | ~60 sợi | Nhiều màu |
| 13 | Adapter 5V 2A (micro USB) | 1 | Cho gateway |
| 14 | Hộp nhựa IP65 | 4 | ~15×10×5 cm |

> [!CAUTION]
> **TUYỆT ĐỐI KHÔNG bật module LoRa khi chưa gắn anten!** Module sẽ hỏng vì sóng RF phản xạ ngược lại chip.

Chi phí ước tính: xem [Danh sách linh kiện chi tiết](../project/component-list.md)

---

## 2. Lắp ráp Sensor Node

### Tổng quan kết nối

```
ESP32 DevKit V1
┌─────────────────────────────────────────────────┐
│   GPIO32 (RX) ◄── TXD ──── AS32-TTL-100 LoRa  │
│   GPIO33 (TX) ──► RXD                          │
│   GPIO25 ────────► MD0                          │
│   GPIO26 ────────► MD1                          │
│   GPIO27 ◄──────── AUX                          │
│                                                  │
│   GPIO16 (RX2) ◄── TX ──── PMS7003 (UART)      │
│   GPIO17 (TX2) ──► RX                           │
│                                                  │
│   GPIO21 (SDA) ◄──► SDA ── CCS811 (I2C)        │
│   GPIO22 (SCL) ◄──► SCL                         │
│                                                  │
│   GPIO4  ◄────── DATA ──── DHT22 (1-Wire)       │
│                   │                              │
│                  10KΩ pull-up → 3.3V             │
│                                                  │
│   GPIO34 (ADC) ◄── Voltage Divider ── Pin 18650 │
│                                                  │
│   Vin ◄── OUT+ ── TP4056 ◄── Pin 18650          │
│   GND ◄── OUT-                                   │
└─────────────────────────────────────────────────┘
```

### Bước 1: Nối LoRa AS32-TTL-100 → ESP32

| AS32 | ESP32 | Ghi chú |
|---|---|---|
| VCC | 3.3V | ⚠️ Hỗ trợ 3.3V–5V |
| GND | GND | |
| TXD | GPIO32 | Module TX → ESP RX |
| RXD | GPIO33 | ESP TX → Module RX |
| MD0 | GPIO25 | Mode control |
| MD1 | GPIO26 | Mode control |
| AUX | GPIO27 | Busy/Ready |

### Bước 2: Nối PMS7003 → ESP32 (UART)

| PMS7003 | ESP32 | Ghi chú |
|---|---|---|
| VCC | 5V (Vin) | PMS7003 cần 5V |
| GND | GND | |
| TX | GPIO16 (RX2) | PMS gửi → ESP nhận |
| RX | GPIO17 (TX2) | ESP gửi → PMS nhận |

> [!IMPORTANT]
> Lưu ý **TX↔RX chéo nhau**: TX của PMS7003 nối vào RX (GPIO16) của ESP32, và ngược lại.

### Bước 3: Nối CCS811 → ESP32 (I2C)

| CCS811 | ESP32 | Ghi chú |
|---|---|---|
| VCC | 3.3V | |
| GND | GND | |
| SDA | GPIO21 | I2C Data |
| SCL | GPIO22 | I2C Clock |
| WAK | GND | **Bắt buộc nối GND** |

> [!TIP]
> Chân WAK phải nối GND để CCS811 hoạt động. Nếu không, chip sẽ ở trạng thái sleep.

### Bước 4: Nối DHT22 → ESP32

| DHT22 | ESP32 | Ghi chú |
|---|---|---|
| VCC (chân 1) | 3.3V | |
| DATA (chân 2) | GPIO4 | Kéo lên 3.3V qua điện trở 10KΩ |
| GND (chân 3) | GND | |

```
    3.3V ─── 10KΩ ──┬── GPIO4 (ESP32)
                     │
                   DATA (DHT22)
```

### Bước 5: Mạch đo pin (Voltage Divider)

```
Pin (+) ── 100KΩ ──┬── 100KΩ ── GND
                    │
                 GPIO34 (ADC)
```

**Công thức:** `V_adc = V_battery × 0.5` (max 4.2V → ADC nhận 2.1V, trong giới hạn 3.3V)

### Bước 6: Cấp nguồn qua TP4056

```
Solar/USB → TP4056 → Pin 18650
                 ↓
            OUT+ → ESP32 Vin
            OUT- → ESP32 GND
```

### Checklist kiểm tra

- [ ] Gắn anten LoRa 433MHz
- [ ] LoRa AS32: nối đúng 7 dây (VCC, GND, TXD, RXD, MD0, MD1, AUX)
- [ ] PMS7003: 5V (Vin), TX↔RX chéo nhau
- [ ] CCS811: 3.3V, chân WAK nối GND
- [ ] DHT22: có điện trở pull-up 10KΩ
- [ ] Voltage divider 2×100KΩ cho battery monitor
- [ ] TP4056 nối pin 18650, OUT → ESP32 Vin
- [ ] Tất cả GND nối chung

---

## 3. Lắp ráp Gateway

Gateway đơn giản hơn, chỉ cần **ESP32 + LoRa AS32-TTL-100**, cấp nguồn qua USB.

| AS32 | ESP32 |
|---|---|
| VCC | 3.3V |
| GND | GND |
| TXD | GPIO16 (RX) |
| RXD | GPIO17 (TX) |
| MD0 | GPIO4 |
| MD1 | GPIO5 |
| AUX | GPIO13 |

**Nguồn:** Adapter 5V/2A qua micro USB (gateway lắp cố định, không cần pin).

### Checklist

- [ ] Gắn anten LoRa 433MHz
- [ ] LoRa AS32 nối đúng
- [ ] Cấp nguồn qua USB 5V
- [ ] WiFi SSID/password đúng trong firmware

---

## 4. Quy trình test sau lắp ráp

### Test 1: Kiểm tra cảm biến (Sensor Node)

Upload firmware test → mở Serial Monitor (115200 baud):

```
========================================
  AIR QUALITY MONITORING - SENSOR NODE
  Node ID: 0x01
========================================
[LoRa] Đang khởi tạo...  OK!
[PMS7003] Đang khởi tạo... OK!
[CCS811] Đang khởi tạo... OK!
[DHT22] Đang khởi tạo... OK!
[OK] Tất cả module đã khởi tạo xong!
```

### Test 2: Kiểm tra truyền nhận LoRa

1. Flash `test_lora` lên sensor node → gửi gói test mỗi 5 giây
2. Flash `test_lora_rx` lên gateway → nhận và in gói tin
3. Kiểm tra 18 bytes nhận đúng giá trị gửi

### Test 3: Khoảng cách LoRa

Tham khảo bảng khoảng cách ở [LoRa Protocol](lora-protocol.md#khoảng-cách-truyền)

---

## 5. Lỗi thường gặp & Cách sửa

| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| `[LoRa] THẤT BẠI!` | Sai kết nối UART hoặc module hỏng | Kiểm tra TXD/RXD, AUX |
| `[CCS811] THẤT BẠI!` | Sai I2C hoặc WAK chưa nối GND | Kiểm tra SDA/SCL, nối WAK→GND |
| `[PMS7003] Lỗi đọc!` | TX/RX nối ngược | Đổi GPIO16 ↔ GPIO17 |
| `[DHT22] Lỗi đọc!` | Thiếu pull-up | Thêm 10KΩ giữa DATA và 3.3V |
| CCS811 luôn CO₂=400 | Chưa warm-up 20 phút | Đợi 20 phút |
| Gateway không nhận LoRa | Khác tần số / Sync Word | Kiểm tra config khớp nhau |
| ESP32 khởi động liên tục | Thiếu nguồn | Nguồn ≥1A hoặc pin đầy |
