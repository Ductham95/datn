# LoRa Protocol — Giao thức Truyền dữ liệu LoRa

## 1. Tổng quan về LoRa

**LoRa (Long Range)** là công nghệ truyền thông không dây tầm xa, tiêu thụ điện năng thấp. Dự án sử dụng LoRa ở chế độ **P2P (Point-to-Point)** với topology hình sao (nhiều Sensor Node → một Gateway).

### 4 thông số cốt lõi

| Thông số | Giá trị dự án | Giải thích |
|---|---|---|
| **Tần số** | 433 MHz | Hợp lệ cho thiết bị công suất thấp tại Việt Nam |
| **Spreading Factor (SF)** | SF7 (mặc định) | Tốc độ nhanh, phù hợp trong nhà < 1km. Tăng lên SF9–SF12 cho outdoor |
| **Bandwidth** | 125 kHz | Cân bằng giữa tốc độ và độ nhạy thu |
| **Sync Word** | 0x12 (mặc định) | Phân biệt mạng LoRa với mạng khác xung quanh |

### Khoảng cách truyền

| Môi trường | Khoảng cách | SF đề xuất |
|---|---|---|
| Trong nhà, cùng tầng | 30–50m | SF7 |
| Trong nhà, khác tầng | 10–30m | SF9 |
| Ngoài trời, thoáng | 1–3 km | SF7 |
| Ngoài trời, có vật cản | 500m–1.5km | SF9–SF10 |
| Ngoài trời, tối đa | 5–10 km | SF12 |

---

## 2. Thiết kế gói tin

### Tại sao không dùng JSON?

| Tiêu chí | JSON | Binary Struct |
|---|---|---|
| Kích thước | ~80+ bytes | **18 bytes** |
| Thời gian phát (Time-on-Air) | Dài → tốn pin | Ngắn → tiết kiệm pin |
| Xác suất lỗi | Cao (gói dài) | Thấp |
| Tuân thủ Duty Cycle | Khó | Dễ |

→ **Dùng `struct` binary** — gói tin chỉ 18 bytes, tỷ lệ sử dụng payload SX1278 chỉ 7%.

### Cấu trúc `SensorPayload` (18 bytes)

```
┌──────────┬──────────┬────────┬────────┬────────┬──────┬──────┬──────┬──────────┬─────────┐
│ Node ID  │ Pkt Type │ Msg ID │ PM2.5  │ PM10   │ CO₂  │ TVOC │ Temp │ Humidity │ Battery │
│ (1 byte) │ (1 byte) │(1 byte)│(2 byte)│(2 byte)│(2 B) │(2 B) │(2 B) │ (2 byte) │ (1 byte)│
└──────────┴──────────┴────────┴────────┴────────┴──────┴──────┴──────┴──────────┴─────────┘
```

### Khai báo struct (C/C++)

```cpp
typedef struct __attribute__((packed)) {
    uint8_t  nodeId;       // 1 byte  — Định danh node (1–255)
    uint8_t  pktType;      // 1 byte  — 0x01=Data, 0x02=Heartbeat
    uint8_t  msgId;        // 1 byte  — Counter phát hiện packet loss (0–255)
    uint16_t pm25;         // 2 bytes — PM2.5 (µg/m³ × 10)
    uint16_t pm10;         // 2 bytes — PM10 (µg/m³ × 10)
    uint16_t co2;          // 2 bytes — CO₂ (ppm)
    uint16_t tvoc;         // 2 bytes — TVOC (ppb)
    int16_t  temperature;  // 2 bytes — Nhiệt độ (°C × 10, có dấu)
    uint16_t humidity;     // 2 bytes — Độ ẩm (% × 10)
    uint8_t  battery;      // 1 byte  — Pin (0–100%)
} SensorPayload;           // Tổng: 18 bytes
```

> [!IMPORTANT]
> `__attribute__((packed))` loại bỏ padding tự động của compiler → đảm bảo kích thước chính xác 18 bytes.

### Giải thích từng trường

| Trường | Kích thước | Dải giá trị | Mã hóa | Giải mã |
|---|---|---|---|---|
| **Node ID** | 1 byte | 0–255 | Trực tiếp | `payload.nodeId` |
| **Pkt Type** | 1 byte | 0x01=Data, 0x02=Heartbeat | Trực tiếp | `payload.pktType` |
| **Msg ID** | 1 byte | 0–255, wrap-around | `msgCounter++` | Kiểm tra khe hở |
| **PM2.5** | 2 bytes | 0–6553.5 µg/m³ | `val × 10` | `pm25 / 10.0` |
| **PM10** | 2 bytes | 0–6553.5 µg/m³ | `val × 10` | `pm10 / 10.0` |
| **CO₂** | 2 bytes | 0–65535 ppm | Trực tiếp | `payload.co2` |
| **TVOC** | 2 bytes | 0–65535 ppb | Trực tiếp | `payload.tvoc` |
| **Temperature** | 2 bytes | −3276.8 – 3276.7°C | `val × 10` (int16_t) | `temperature / 10.0` |
| **Humidity** | 2 bytes | 0–6553.5% | `val × 10` | `humidity / 10.0` |
| **Battery** | 1 byte | 0–100% | Trực tiếp | `payload.battery` |

---

## 3. Quy trình gửi (Sensor Node)

```cpp
SensorPayload payload;
payload.nodeId  = NODE_ID;
payload.pktType = 0x01;          // Data packet
payload.msgId   = msgCounter++;

// Mã hóa: nhân × 10 để ép float → integer
payload.pm25        = (uint16_t)(pm25_float * 10.0);
payload.temperature = (int16_t)(temp_float * 10.0);

// Gửi nguyên khối 18 bytes qua LoRa UART
Serial1.write((uint8_t*)&payload, sizeof(SensorPayload));
```

## 4. Quy trình nhận (Gateway)

```cpp
SensorPayload received;

// Đọc 18 bytes từ LoRa UART
Serial2.readBytes((uint8_t*)&received, sizeof(SensorPayload));

// Giải mã: chia / 10.0
float pm25  = received.pm25 / 10.0;       // 125 → 12.5
float temp  = received.temperature / 10.0; // 285 → 28.5
```

---

## 5. Phát hiện mất gói (Packet Loss)

Field `msgId` là counter 0–255, tự động tăng sau mỗi lần gửi:

- Nếu Gateway nhận `msgId = 5` rồi tiếp theo `msgId = 7` → **mất 1 gói** (ID 6)
- Wrap-around: `255 → 0` là bình thường
- Với chu kỳ 5 phút/gói → counter wrap mỗi ~21 giờ

---

## 6. Loại gói tin (Pkt Type)

| Mã | Tên | Mô tả |
|---|---|---|
| `0x01` | **DATA** | Gói dữ liệu cảm biến đầy đủ |
| `0x02` | **HEARTBEAT** | Node còn sống nhưng không có data (timeout queue) |
