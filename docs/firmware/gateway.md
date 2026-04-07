# Gateway Firmware — Firmware ESP32 Gateway

## 1. Tổng quan

Gateway nhận gói tin LoRa từ các sensor node, buffer lại, rồi gửi batch lên server qua HTTP POST.

| Thuộc tính | Giá trị |
|---|---|
| **Platform** | ESP32 DevKit V1 (PlatformIO, Arduino) |
| **Kiến trúc** | Superloop + Interrupt Callback (không dùng FreeRTOS) |
| **Giao thức LoRa** | AS32-TTL-100 (UART, 433 MHz) |
| **Giao thức lên Server** | HTTP POST (JSON batch) |
| **Buffer** | Ring buffer ISR-safe (portMUX spinlock) |

---

## 2. Data Flow

```
Sensor Node ──LoRa 18B──→ lora_rx_poll() ──→ PacketBuffer ──→ HTTP POST JSON ──→ Server API
                          (parse binary)      (ring buffer)    (ArduinoJson)     /api/v1/telemetry
                          (poll mỗi 100ms)    (ISR-safe)       (retry × 3)
```

**Logic chính trong `loop()`:**
1. Kiểm tra WiFi, reconnect nếu mất
2. Poll LoRa UART mỗi 100ms → parse 18 bytes → push vào ring buffer
3. Khi buffer đầy hoặc hết timeout 30 giây → flush qua HTTP POST

---

## 3. Cấu trúc thư mục

```
firmware/gateway/
├── platformio.ini                      # 4 environments (main + 3 tests)
├── include/
│   └── config.h                        # WiFi, API URL, LoRa, buffer config
├── src/
│   ├── main.cpp                        # Superloop: WiFi reconnect + buffer flush
│   ├── common/
│   │   ├── packet.h                    # SensorPayload 18 bytes (shared)
│   │   └── debug.h                     # LOG macros
│   ├── core/
│   │   └── packet_buffer.h/.cpp        # ISR-safe ring buffer (portMUX spinlock)
│   ├── drivers/
│   │   ├── lora_receiver.h/.cpp        # lora_rx_poll(), parse + RSSI
│   │   └── wifi_manager.h/.cpp         # Init + auto-reconnect
│   └── net/
│       └── http_client.h/.cpp          # JSON serialize + HTTP POST with retry
└── test/
    ├── test_wifi.cpp                   # Test WiFi connection
    ├── test_lora_rx.cpp                # Test nhận/decode gói LoRa
    └── test_http.cpp                   # Test HTTP POST JSON
```

---

## 4. Pin Mapping (AS32-TTL-100)

| Chân AS32 | GPIO | Ghi chú |
|---|---|---|
| TXD → RX | **GPIO16** | Serial2 RX |
| RXD ← TX | **GPIO17** | Serial2 TX |
| MD0 | **GPIO4** | Mode control |
| MD1 | **GPIO5** | Mode control |
| AUX | **GPIO13** | Busy/Ready indicator |

---

## 5. Cấu hình (`config.h`)

```cpp
// WiFi
#define WIFI_SSID       "your_ssid"
#define WIFI_PASSWORD   "your_password"

// Server API
#define API_URL         "http://your-server:3000/api/v1/telemetry"

// Gateway Identity
#define GATEWAY_ID      "GW_001"

// Buffer
#define BUFFER_SIZE     10      // Số gói tối đa trước khi flush
#define FLUSH_TIMEOUT   30000   // Timeout flush (ms)
```

---

## 6. JSON Payload

Gateway serialize buffer thành JSON batch rồi POST lên server:

```json
{
  "gateway_id": "GW_001",
  "readings": [
    {
      "node_id": "NODE_001",
      "pm25": 12.5,
      "pm10": 18.3,
      "co2": 485,
      "tvoc": 120,
      "temperature": 28.5,
      "humidity": 65.2,
      "battery": 85,
      "rssi": 0
    }
  ]
}
```

> [!NOTE]
> Module AS32-TTL-100 không cung cấp RSSI qua UART. Gateway gửi `rssi: 0` lên server. Nếu cần RSSI thực, phải đọc register qua sleep mode command — không cần thiết cho đồ án.

---

## 7. Build & Flash

```bash
# Build firmware chính
pio run -e esp32dev

# Flash + monitor
pio run -e esp32dev -t upload && pio device monitor

# Test từng module
pio run -e test_wifi -t upload && pio device monitor
pio run -e test_lora_rx -t upload && pio device monitor
pio run -e test_http -t upload && pio device monitor
```

### Kết quả build

```
Environment    Status    Duration
-------------  --------  -----------
esp32dev       SUCCESS   ~12s  (72.7% Flash)
test_wifi      SUCCESS   ~10s
test_lora_rx   SUCCESS   ~7s
test_http      SUCCESS   ~13s
```
