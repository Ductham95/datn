# Viết Lại LoRa Driver Cho AS32-TTL-100 (UART)

## Thông số AS32-TTL-100

- **Chip**: SX1278 (bên trong module, nhưng giao tiếp qua UART, không SPI)
- **Tần số**: 433 MHz (410–441 MHz, 32 kênh)
- **Công suất**: 100mW (20 dBm)
- **Giao tiếp**: **UART TTL** (9600 baud mặc định)
- **Buffer**: 256 bytes FIFO (gửi + nhận)

### Chân kết nối

| Chân module | Chức năng | Nối tới ESP32 |
|---|---|---|
| **VCC** | Nguồn 3.3V–5V | 3.3V |
| **GND** | Mass | GND |
| **TXD** | Module TX → ESP32 RX | GPIO16 (UART2 RX) |
| **RXD** | ESP32 TX → Module RX | GPIO17 (UART2 TX) |
| **MD0** | Mode bit 0 | GPIO4 |
| **MD1** | Mode bit 1 | GPIO15 |
| **AUX** | Busy/Ready (LOW=bận) | GPIO13 |

### Chế độ hoạt động (MD0/MD1)

| Mode | MD1 | MD0 | Mô tả |
|---|---|---|---|
| **Normal** | 0 | 0 | UART ↔ LoRa transparent (dùng cho gửi/nhận) |
| **Wake-up** | 0 | 1 | Thêm preamble để đánh thức receiver đang power-saving |
| **Power-saving** | 1 | 0 | UART tắt, LoRa WOR (mở khi có gói) |
| **Sleep** | 1 | 1 | Cấu hình module bằng lệnh 0xC0/0xC2 |

### Cách hoạt động

**Gửi**: ESP32 ghi data vào UART → module tự điều chế LoRa → phát RF
**Nhận**: Module nhận RF → giải điều chế → đẩy data ra UART TX → ESP32 đọc

> [!IMPORTANT]
> Module AS32-TTL-100 là **transparent serial bridge** — ghi gì vào UART thì bên kia nhận nguyên xi. Viết `Serial.write(payload, 18)` → bên nhận đọc `Serial.read()` được đúng 18 bytes. Không cần thêm header/framing — module tự thêm LoRa preamble + CRC.

---

## Proposed Changes

### Sensor Node (4 files sửa, 1 file xóa dependency)

#### [MODIFY] [config.h](file:///d:/datn/firmware/sensor-node/include/config.h)

Thay SPI pins → UART + GPIO pins cho AS32:

```diff
-// ===== LoRa SPI Pins =====
-#define LORA_CS_PIN         5
-#define LORA_RST_PIN        14
-#define LORA_DIO0_PIN       2
+// ===== LoRa AS32-TTL-100 (UART) =====
+#define LORA_RX_PIN         16      // ESP32 RX ← Module TXD
+#define LORA_TX_PIN         17      // ESP32 TX → Module RXD
+#define LORA_MD0_PIN        4       // Mode bit 0
+#define LORA_MD1_PIN        15      // Mode bit 1
+#define LORA_AUX_PIN        13      // AUX (LOW = busy)
+#define LORA_BAUD           9600    // UART baud rate
```

> [!WARNING]
> **Pin conflict**: Sensor node hiện dùng GPIO4 cho DHT22 và GPIO15 cho PMS7003 SET pin.
> - **DHT22** cần chuyển sang GPIO khác (ví dụ GPIO **25** hoặc **26**)
> - **PMS7003 SET** cần chuyển sang GPIO khác (ví dụ GPIO **27**)
> - Hoặc chọn GPIO khác cho MD0/MD1 nếu muốn giữ nguyên DHT22/PMS7003

#### [MODIFY] [lora_radio.h](file:///d:/datn/firmware/sensor-node/src/drivers/lora_radio.h)

Giữ nguyên API interface (để sensor_task + lora_task không cần sửa):
- [lora_init()](file:///d:/datn/firmware/sensor-node/src/drivers/lora_radio.cpp#14-39) → Init UART2 + cấu hình MD0/MD1 Normal mode
- [lora_sendPacket()](file:///d:/datn/firmware/sensor-node/src/drivers/lora_radio.cpp#40-58) → Chờ AUX HIGH → `Serial2.write(payload, 18)` → chờ AUX HIGH
- [lora_sleep()](file:///d:/datn/firmware/sensor-node/src/drivers/lora_radio.cpp#59-63) → MD0=1, MD1=1 (Sleep mode)
- [lora_wakeup()](file:///d:/datn/firmware/sensor-node/src/drivers/lora_radio.cpp#64-67) → MD0=0, MD1=0 (Normal mode)

#### [MODIFY] [lora_radio.cpp](file:///d:/datn/firmware/sensor-node/src/drivers/lora_radio.cpp)

Viết lại hoàn toàn từ SPI → UART.

#### [MODIFY] [platformio.ini](file:///d:/datn/firmware/sensor-node/platformio.ini)

Xóa `sandeepmistry/LoRa@^0.8.0` khỏi lib_deps (không cần library bên ngoài).

---

### Gateway (4 files sửa)

#### [MODIFY] [config.h](file:///d:/datn/firmware/gateway/include/config.h)

Tương tự sensor node — thay SPI → UART pins.

#### [MODIFY] [lora_receiver.h/.cpp](file:///d:/datn/firmware/gateway/src/drivers/lora_receiver.h)

Thay `LoRa.onReceive()` (SPI callback) → poll UART trong loop (hoặc `serialEvent`).
- Không cần `onReceive` — gateway loop mỗi 100ms đã đủ nhanh
- Dùng AUX pin để biết khi nào có data sẵn

#### [MODIFY] [platformio.ini](file:///d:/datn/firmware/gateway/platformio.ini)

Xóa `sandeepmistry/LoRa@^0.8.0`.

#### [MODIFY] test files

Cập nhật [test_lora.cpp](file:///d:/datn/firmware/sensor-node/test/test_lora.cpp) (sensor node) và [test_lora_rx.cpp](file:///d:/datn/firmware/gateway/test/test_lora_rx.cpp) (gateway).

---

## Verification Plan

1. Build cả 2 project sau khi sửa
2. Flash `test_lora` lên sensor node → gửi gói test mỗi 5s
3. Flash `test_lora_rx` lên gateway → nhận và in gói tin
4. Kiểm tra 18 bytes nhận đúng giá trị gửi
