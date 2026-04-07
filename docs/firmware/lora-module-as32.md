# Module AS32-TTL-100 — LoRa UART Module

## 1. Thông số kỹ thuật

| Thuộc tính | Giá trị |
|---|---|
| **Chip** | SX1278 (bên trong, giao tiếp qua UART không phải SPI) |
| **Tần số** | 433 MHz (410–441 MHz, 32 kênh) |
| **Công suất** | 100mW (20 dBm) |
| **Giao tiếp** | UART TTL (9600 baud mặc định) |
| **Buffer** | 256 bytes FIFO (gửi + nhận) |
| **Nguồn** | 3.3V–5V |

---

## 2. Nguyên lý hoạt động

Module AS32-TTL-100 là **transparent serial bridge**:

- **Gửi**: ESP32 ghi data vào UART → module tự điều chế LoRa → phát RF
- **Nhận**: Module nhận RF → giải điều chế → đẩy data ra UART TX → ESP32 đọc

> [!IMPORTANT]
> Ghi gì vào UART thì bên kia nhận nguyên xi. Viết `Serial.write(payload, 18)` → bên nhận đọc `Serial.read()` được đúng 18 bytes. Không cần framing — module tự thêm LoRa preamble + CRC.

---

## 3. Chân kết nối

| Chân module | Chức năng | Mô tả |
|---|---|---|
| **VCC** | Nguồn | 3.3V–5V |
| **GND** | Mass | GND |
| **TXD** | Module TX → ESP32 RX | Dữ liệu từ LoRa ra ESP32 |
| **RXD** | ESP32 TX → Module RX | Dữ liệu từ ESP32 vào LoRa |
| **MD0** | Mode bit 0 | Chọn chế độ hoạt động |
| **MD1** | Mode bit 1 | Chọn chế độ hoạt động |
| **AUX** | Busy/Ready | LOW = đang bận, HIGH = sẵn sàng |

### Pin Mapping — Sensor Node

| Chân AS32 | GPIO | Lý do chọn |
|---|---|---|
| TXD → RX | **GPIO32** | Serial1 remap (Serial2 đã dùng cho PMS7003) |
| RXD ← TX | **GPIO33** | Serial1 remap |
| MD0 | **GPIO25** | Tránh GPIO4 (DHT22) |
| MD1 | **GPIO26** | Tránh GPIO15 (PMS SET) |
| AUX | **GPIO27** | Free GPIO |

### Pin Mapping — Gateway

| Chân AS32 | GPIO | Lý do chọn |
|---|---|---|
| TXD → RX | **GPIO16** | Serial2 (không có PMS7003) |
| RXD ← TX | **GPIO17** | Serial2 |
| MD0 | **GPIO4** | Free |
| MD1 | **GPIO5** | Free |
| AUX | **GPIO13** | Free |

---

## 4. Chế độ hoạt động (MD0/MD1)

| Mode | MD1 | MD0 | Mô tả |
|---|---|---|---|
| **Normal** | 0 | 0 | UART ↔ LoRa transparent (dùng cho gửi/nhận data) |
| **Wake-up** | 0 | 1 | Thêm preamble để đánh thức receiver đang power-saving |
| **Power-saving** | 1 | 0 | UART tắt, LoRa WOR (wake-on-radio) |
| **Sleep** | 1 | 1 | Cấu hình module bằng lệnh AT (0xC0/0xC2) |

Dự án chỉ sử dụng 2 mode:
- **Normal** (MD0=0, MD1=0): Khi gửi/nhận dữ liệu
- **Sleep** (MD0=1, MD1=1): Khi không truyền, tiết kiệm pin

---

## 5. Driver API

Driver tự viết (không cần thư viện bên ngoài), giữ nguyên API interface:

```cpp
// Sensor Node (lora_radio.h)
bool lora_init();                           // Init UART + MD0/MD1 Normal mode
bool lora_sendPacket(SensorPayload* pkt);   // Chờ AUX HIGH → write 18 bytes → chờ AUX
void lora_sleep();                          // MD0=1, MD1=1
void lora_wakeup();                         // MD0=0, MD1=0

// Gateway (lora_receiver.h)
void lora_rx_init();                        // Init UART + Normal mode
bool lora_rx_poll(SensorPayload* out);      // Poll UART, parse 18 bytes nếu có
```

### Quy trình gửi (Sensor Node)

```
1. Kiểm tra AUX == HIGH (module sẵn sàng)
2. Serial.write(payload, 18 bytes)
3. Chờ AUX xuống LOW rồi lên HIGH (gửi xong)
```

### Quy trình nhận (Gateway)

```
1. Poll Serial.available() mỗi 100ms
2. Tích lũy bytes (byte accumulation + timeout)
3. Khi đủ 18 bytes → memcpy vào SensorPayload struct
4. Validate: nodeId > 0, pktType hợp lệ
```

---

## 6. Lưu ý

> [!WARNING]
> AS32-TTL-100 **không cung cấp RSSI** qua UART. Gateway gửi `rssi: 0` lên server. Nếu cần RSSI thực, phải đọc register qua sleep mode command — nhưng không cần thiết cho đồ án.

> [!CAUTION]
> **Luôn gắn anten 433MHz trước khi cấp nguồn!** Module LoRa sẽ hỏng nếu phát RF không có anten (sóng phản xạ ngược lại chip).
