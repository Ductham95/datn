# Gateway Firmware — Firmware ESP32 Gateway

## 1. Tổng quan

Gateway nhận gói tin LoRa từ các sensor node, buffer lại, rồi gửi batch lên server qua HTTP POST.

| Thuộc tính | Giá trị |
|---|---|
| **Platform** | ESP32 DevKit V1 (PlatformIO, Arduino) |
| **Kiến trúc** | Superloop + Interrupt Callback (không dùng FreeRTOS) |
| **Cấu hình** | NVS (Non-Volatile Storage) via Captive Portal |
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
│   └── config.h                        # Pin mapping, server URL, provision key
├── src/
│   ├── main.cpp                        # Provisioning check + Superloop
│   ├── common/
│   │   ├── packet.h                    # SensorPayload 18 bytes (shared)
│   │   └── debug.h                     # LOG macros
│   ├── core/
│   │   ├── nvs_config.h/.cpp           # NVS read/write (gateway_id, WiFi, server)
│   │   └── packet_buffer.h/.cpp        # ISR-safe ring buffer (portMUX spinlock)
│   ├── provisioning/
│   │   ├── captive_portal.h/.cpp       # WiFi AP + DNS redirect + Web Server
│   │   └── portal_html.h              # Embedded HTML (wizard 2 bước)
│   ├── drivers/
│   │   ├── lora_receiver.h/.cpp        # lora_rx_poll(), parse + RSSI
│   │   └── wifi_manager.h/.cpp         # Init + auto-reconnect (dùng NVS config)
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

`config.h` chỉ chứa **pin mapping** và **hằng số cấu hình cứng**. Các thông tin runtime (Gateway ID, WiFi) được lưu trong **NVS** và cấu hình qua Captive Portal.

```cpp
// Hằng số cố định
#define SERVER_BASE_URL   "http://192.168.137.1:3000"
#define PROVISION_KEY     "airquality2026"
#define GATEWAY_SECRET    "super-secret-key"

// Buffer
#define PACKET_BUFFER_SIZE 10      // Tối đa 10 gói chờ gửi
#define FLUSH_INTERVAL_MS  30000   // Gửi HTTP mỗi 30 giây
```

Cấu hình runtime (lưu trong NVS, thiết lập qua Captive Portal):

| Biến | Kiểu | Mô tả |
|---|---|---|
| `cfg_gatewayId` | `char[16]` | Gateway ID (VD: `GW_001`) |
| `cfg_wifiSsid` | `char[64]` | SSID WiFi đã chọn |
| `cfg_wifiPassword` | `char[64]` | Mật khẩu WiFi |
| `cfg_apiUrl` | `char[128]` | URL API telemetry (tự tạo từ server base) |

Xem thêm: [Hướng dẫn Provisioning](../guides/provisioning.md)

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
esp32dev       SUCCESS   ~12s  (76.6% Flash, 14.8% RAM)
test_wifi      SUCCESS   ~10s
test_lora_rx   SUCCESS   ~7s
test_http      SUCCESS   ~13s
```

---

## 8. Chế độ Provisioning

Khi Gateway chưa được cấu hình (NVS trống), nó tự động vào chế độ **Captive Portal**:

1. Phát WiFi AP: `AirQuality-GW-Setup`
2. LED nhấp nháy nhanh (2Hz)
3. User kết nối → điền form (2 bước: WiFi → Tên)
4. ESP32 đăng ký với server → lưu NVS → reboot vào normal mode

**Factory Reset**: Giữ nút BOOT (GPIO0) 5 giây → xoá NVS → reboot vào provisioning

Xem chi tiết: [Hướng dẫn Provisioning](../guides/provisioning.md)
