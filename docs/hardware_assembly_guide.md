# 🔧 Hướng dẫn lắp ráp phần cứng

## Danh sách linh kiện cần chuẩn bị

| STT | Linh kiện | SL | Ghi chú |
|---|---|---|---|
| 1 | ESP32 DevKit V1 | 4 | 3 node + 1 gateway |
| 2 | Module LoRa SX1278 (Ra-02) | 4 | Tần số 433MHz |
| 3 | Anten LoRa 433MHz + dây pigtail | 4 | **BẮT BUỘC** - không bật LoRa khi chưa gắn anten! |
| 4 | Cảm biến PMS7003 + adapter board | 3 | Cáp ribbon đi kèm |
| 5 | Cảm biến CCS811 breakout board | 3 | Adafruit hoặc CJMCU |
| 6 | Cảm biến DHT22 | 3 | Loại có 3 chân (trên breakout board) |
| 7 | Pin 18650 + đế pin | 3 | Lithium 3.7V, dung lượng ≥2500mAh |
| 8 | Module sạc TP4056 | 3 | Loại có mạch bảo vệ |
| 9 | Điện trở 10KΩ | 3 | Pull-up cho DHT22 |
| 10 | Điện trở 100KΩ | 6 | Voltage divider (2 cái/node) |
| 11 | Breadboard 830 lỗ | 4 | Hoặc PCB đục lỗ |
| 12 | Dây jumper đực-cái, đực-đực | ~60 sợi | Nhiều màu để phân biệt |
| 13 | Adapter 5V 2A (micro USB) | 1 | Cho gateway |
| 14 | Hộp nhựa kín nước IP65 | 4 | Khoảng 15×10×5 cm |

> [!CAUTION]
> **TUYỆT ĐỐI KHÔNG bật module LoRa SX1278 khi chưa gắn anten!** Module sẽ hỏng vì sóng RF phản xạ ngược lại chip.

---

## Phần A: Lắp ráp SENSOR NODE

### Sơ đồ tổng quan

![Sơ đồ nối dây Sensor Node](C:/Users/ADMIN/.gemini/antigravity/brain/f1b3001b-9125-49d3-9bab-df2515cf8e69/sensor_node_wiring_1772697681110.png)

### Bước 1: Nối LoRa SX1278 → ESP32 (SPI)

| LoRa SX1278 | ESP32 | Màu dây | Ghi chú |
|---|---|---|---|
| **VCC** | **3.3V** | 🔴 Đỏ | ⚠️ Chỉ dùng 3.3V, KHÔNG 5V! |
| **GND** | **GND** | ⚫ Đen | |
| **SCK** | **GPIO 18** | 🔵 Xanh dương | SPI Clock |
| **MISO** | **GPIO 19** | 🔵 Xanh dương | SPI Data Out |
| **MOSI** | **GPIO 23** | 🔵 Xanh dương | SPI Data In |
| **NSS (CS)** | **GPIO 5** | 🟡 Vàng | Chip Select |
| **RST** | **GPIO 14** | 🟡 Vàng | Reset |
| **DIO0** | **GPIO 2** | 🟡 Vàng | Interrupt |

> [!WARNING]
> Module LoRa SX1278 hoạt động ở **3.3V**. Cấp 5V sẽ **cháy module**!

```
ESP32 DevKit V1                    LoRa SX1278
┌──────────────┐                  ┌──────────────┐
│          3V3 ├──── 🔴 ────────▶│ VCC          │
│          GND ├──── ⚫ ────────▶│ GND          │
│       GPIO18 ├──── 🔵 ────────▶│ SCK          │
│       GPIO19 ├──── 🔵 ◀────────│ MISO         │
│       GPIO23 ├──── 🔵 ────────▶│ MOSI         │
│        GPIO5 ├──── 🟡 ────────▶│ NSS          │
│       GPIO14 ├──── 🟡 ────────▶│ RST          │
│        GPIO2 ├──── 🟡 ◀────────│ DIO0         │
└──────────────┘                  │         ANT ─┤── 🔲 Anten 433MHz
                                  └──────────────┘
```

**Kiểm tra:** Gắn anten 433MHz vào connector SMA/IPEX trước khi cấp nguồn.

---

### Bước 2: Nối PMS7003 → ESP32 (UART2)

PMS7003 dùng connector 8 pin nhỏ, cần adapter board hoặc hàn trực tiếp.

| PMS7003 | ESP32 | Màu dây | Ghi chú |
|---|---|---|---|
| **VCC** | **5V (Vin)** | 🔴 Đỏ | PMS7003 cần 5V |
| **GND** | **GND** | ⚫ Đen | |
| **TX** | **GPIO 16 (RX2)** | 🟠 Cam | PMS gửi → ESP nhận |
| **RX** | **GPIO 17 (TX2)** | 🟠 Cam | ESP gửi → PMS nhận |
| **SET** | Không nối | | Để mặc định HIGH |
| **RESET** | Không nối | | Để mặc định HIGH |

```
PMS7003 (adapter board)            ESP32
┌──────────────┐                  ┌──────────────┐
│          VCC ├──── 🔴 ────────▶│ Vin (5V)     │
│          GND ├──── ⚫ ────────▶│ GND          │
│           TX ├──── 🟠 ────────▶│ GPIO16 (RX2) │
│           RX ├──── 🟠 ◀────────│ GPIO17 (TX2) │
└──────────────┘                  └──────────────┘
```

> [!IMPORTANT]
> Lưu ý **TX↔RX chéo nhau**: TX của PMS7003 nối vào RX của ESP32 (GPIO16), và ngược lại.

---

### Bước 3: Nối CCS811 → ESP32 (I2C)

| CCS811 | ESP32 | Màu dây | Ghi chú |
|---|---|---|---|
| **VCC** | **3.3V** | 🔴 Đỏ | |
| **GND** | **GND** | ⚫ Đen | |
| **SDA** | **GPIO 21** | 🟢 Xanh lá | I2C Data |
| **SCL** | **GPIO 22** | 🟢 Xanh lá | I2C Clock |
| **WAK** | **GND** | ⚫ Đen | Kéo LOW để "đánh thức" chip |
| **INT** | Không nối | | Tuỳ chọn |
| **RST** | Không nối | | Có pull-up nội bộ |

```
CCS811 Breakout                    ESP32
┌──────────────┐                  ┌──────────────┐
│          VCC ├──── 🔴 ────────▶│ 3V3          │
│          GND ├──── ⚫ ────────▶│ GND          │
│          SDA ├──── 🟢 ◀───────▶│ GPIO21 (SDA) │
│          SCL ├──── 🟢 ◀───────▶│ GPIO22 (SCL) │
│          WAK ├──── ⚫ ────────▶│ GND          │
└──────────────┘                  └──────────────┘
```

> [!TIP]
> **Chân WAK phải nối GND** để CCS811 hoạt động. Nếu không, chip sẽ ở trạng thái sleep và không đọc được dữ liệu.

---

### Bước 4: Nối DHT22 → ESP32 (1-Wire)

| DHT22 | ESP32 | Ghi chú |
|---|---|---|
| **VCC** (chân 1) | **3.3V** | |
| **DATA** (chân 2) | **GPIO 4** | Kéo lên 3.3V qua điện trở 10KΩ |
| **GND** (chân 3) | **GND** | |

```
        3.3V
         │
         ├──── 10KΩ ────┐
         │               │
DHT22    │               │         ESP32
┌────────┤               │        ┌──────────────┐
│   VCC ─┘               │        │              │
│  DATA ──────────────────┴───────▶│ GPIO4        │
│   GND ──── ⚫ ──────────────────▶│ GND          │
└────────┘                         └──────────────┘
```

> [!NOTE]
> Điện trở pull-up 10KΩ nối giữa chân DATA và VCC (3.3V). Nếu dùng DHT22 trên breakout board (3 chân), điện trở này có thể đã tích hợp sẵn trên board.

---

### Bước 5: Mạch đo pin (Battery Monitor)

Dùng **voltage divider** 2 điện trở 100KΩ để chia đôi điện áp pin trước khi đưa vào ADC.

```
Pin 18650 (max 4.2V)
    (+) ──────┬──── 100KΩ ────┬──── 100KΩ ────┐
              │               │                │
              │               ▼                ▼
              │          ESP32 GPIO34        GND
              │          (ADC, max 3.3V)
              │
    (-) ──────┴──── GND ESP32
```

| Kết nối | Mô tả |
|---|---|
| Pin (+) → Điện trở 100KΩ #1 → GPIO34 | Điểm giữa voltage divider |
| GPIO34 → Điện trở 100KΩ #2 → GND | Hoàn thành voltage divider |
| Pin (-) → GND ESP32 | Nối mass chung |

**Công thức:** `V_adc = V_battery × (R2 / (R1 + R2)) = V_battery × 0.5`

---

### Bước 6: Cấp nguồn qua TP4056

```
                    TP4056
              ┌──────────────────┐
Solar/USB ───▶│ IN+         BAT+ ├──── Pin 18650 (+)
              │ IN-         BAT- ├──── Pin 18650 (-)
              │              OUT+ ├──── ESP32 Vin (5V)
              │              OUT- ├──── ESP32 GND
              └──────────────────┘
```

| TP4056 | Nối tới | Ghi chú |
|---|---|---|
| **BAT+** / **BAT-** | Pin 18650 | Để sạc pin |
| **OUT+** | ESP32 **Vin** | Cấp nguồn cho toàn bộ mạch |
| **OUT-** | ESP32 **GND** | Mass chung |
| **IN+** / **IN-** | Micro USB hoặc Solar 5V | Nguồn sạc |

---

### Checklist kiểm tra Sensor Node

- [ ] Gắn anten LoRa 433MHz
- [ ] LoRa SX1278 nối đúng 8 dây SPI (3.3V, KHÔNG 5V)
- [ ] PMS7003 nối 5V (Vin), TX↔RX chéo nhau
- [ ] CCS811 nối 3.3V, chân WAK nối GND
- [ ] DHT22 có điện trở pull-up 10KΩ
- [ ] Voltage divider 2×100KΩ cho battery monitor
- [ ] TP4056 nối pin 18650, OUT → ESP32 Vin
- [ ] Tất cả GND nối chung

---

## Phần B: Lắp ráp GATEWAY

Gateway đơn giản hơn, chỉ cần **ESP32 + LoRa SX1278**.

### Sơ đồ

![Sơ đồ nối dây Gateway](C:/Users/ADMIN/.gemini/antigravity/brain/f1b3001b-9125-49d3-9bab-df2515cf8e69/gateway_wiring_1772697681110.png)

### Bảng nối dây

Giống hệt **Bước 1** của Sensor Node:

| LoRa SX1278 | ESP32 |
|---|---|
| VCC | 3.3V |
| GND | GND |
| SCK | GPIO 18 |
| MISO | GPIO 19 |
| MOSI | GPIO 23 |
| NSS | GPIO 5 |
| RST | GPIO 14 |
| DIO0 | GPIO 2 |

**Nguồn:** Cấp qua cổng micro USB bằng adapter 5V/2A (gateway cắm cố định, không cần pin).

### Checklist kiểm tra Gateway
- [ ] Gắn anten LoRa 433MHz
- [ ] LoRa SX1278 nối đúng (3.3V!)
- [ ] Cấp nguồn qua USB 5V
- [ ] ESP32 kết nối được WiFi (kiểm tra SSID/password trong code)

---

## Phần C: Quy trình kiểm tra sau lắp ráp

### Test 1: Kiểm tra cảm biến (Sensor Node)

1. **Upload firmware** sensor node qua PlatformIO
2. Mở **Serial Monitor** (115200 baud)
3. Kiểm tra output:

```
========================================
  AIR QUALITY MONITORING - SENSOR NODE
  Node ID: 0x01
========================================
[LoRa] Đang khởi tạo...  OK!
  Freq: 433 MHz, SF: 7, BW: 125 kHz, TxPower: 17 dBm
[PMS7003] Đang khởi tạo... OK!
[CCS811] Đang khởi tạo... OK!
  Cần warm-up 20 phút để dữ liệu chính xác.
[DHT22] Đang khởi tạo... OK!
[OK] Tất cả module đã khởi tạo xong!
```

> [!WARNING]
> Nếu thấy `THẤT BẠI!` ở module nào → kiểm tra lại dây nối của module đó.

### Test 2: Kiểm tra truyền nhận LoRa

1. Upload firmware **Gateway** lên ESP32 thứ 2
2. Đặt Gateway gần Sensor Node (cùng phòng)
3. Kiểm tra Gateway Serial Monitor:

```
[LoRa] Nhận gói tin #1 từ Node 0x01 (RSSI: -45 dBm, SNR: 10.2 dB)
  ┌─── Dữ liệu Node ───────────────┐
  │ PM2.5:   12.3 µg/m³             │
  │ CO2:      485 ppm               │
  ...
[MQTT] Đã gửi lên topic: airquality/data
```

### Test 3: Kiểm tra khoảng cách

| Môi trường | Khoảng cách dự kiến | SF đề xuất |
|---|---|---|
| Trong nhà, cùng tầng | 30-50m | SF7 |
| Trong nhà, khác tầng | 10-30m | SF9 |
| Ngoài trời, thoáng | 1-3 km | SF7 |
| Ngoài trời, có vật cản | 500m-1.5km | SF9-SF10 |
| Ngoài trời, tối đa | 5-10 km | SF12 |

> [!TIP]
> Nếu RSSI < -110 dBm hoặc mất gói nhiều, hãy tăng **Spreading Factor** trong code (thay đổi `LORA_SPREAD_FACTOR` từ 7 lên 9 hoặc 12 ở cả 2 firmware).

---

## Phần D: Lỗi thường gặp & Cách sửa

| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| `[LoRa] THẤT BẠI!` | Sai kết nối SPI hoặc module hỏng | Kiểm tra 8 dây SPI, đặc biệt CS (GPIO5) |
| `[CCS811] THẤT BẠI!` | Sai I2C hoặc chân WAK chưa nối GND | Kiểm tra SDA/SCL, nối WAK→GND |
| `[PMS7003] Lỗi đọc!` | TX/RX nối ngược | Đổi GPIO16 ↔ GPIO17 |
| `[DHT22] Lỗi đọc!` | Thiếu điện trở pull-up | Thêm 10KΩ giữa DATA và 3.3V |
| CCS811 luôn trả về CO₂=400 | Chưa warm-up đủ 20 phút | Đợi 20 phút sau khi bật nguồn |
| Gateway không nhận LoRa | Khác Sync Word hoặc Freq | Kiểm tra `LORA_SYNC_WORD` & `LORA_FREQUENCY` khớp nhau |
| RSSI rất yếu (<-110 dBm) | Chưa gắn anten hoặc anten sai | Gắn anten 433MHz, kiểm tra tần số |
| ESP32 khởi động liên tục | Thiếu nguồn (PMS7003 tốn ~150mA) | Dùng nguồn ≥1A hoặc pin đầy |
