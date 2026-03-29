# Gateway Firmware - Walkthrough

## Kiến trúc

**Superloop + Interrupt Callback** (không dùng FreeRTOS):
- LoRa nhận gói tin qua `onReceive()` ISR callback → push vào ring buffer
- [loop()](file:///d:/datn/firmware/sensor-node/test/test_lora.cpp#70-111) kiểm tra buffer mỗi 100ms → flush qua HTTP POST khi đầy hoặc hết timeout 30s

## Files Created (16 files)

```
firmware/gateway/
├── platformio.ini                          ← 4 environments (main + 3 tests)
├── include/config.h                        ← WiFi, API, LoRa, buffer config
├── src/
│   ├── main.cpp                            ← Superloop: WiFi reconnect + buffer flush
│   ├── common/packet.h                     ← SensorPayload 18 bytes (shared with sensor-node)
│   ├── common/debug.h                      ← LOG macros
│   ├── core/packet_buffer.h/.cpp           ← ISR-safe ring buffer (portMUX spinlock)
│   ├── drivers/lora_receiver.h/.cpp        ← onReceive callback, parse + RSSI
│   ├── drivers/wifi_manager.h/.cpp         ← Init + auto-reconnect
│   └── net/http_client.h/.cpp              ← JSON serialize + HTTP POST with retry
└── test/
    ├── test_wifi.cpp                       ← Test WiFi connection + signal quality
    ├── test_lora_rx.cpp                    ← Test nhận/decode gói từ sensor node
    └── test_http.cpp                       ← Test HTTP POST JSON lên server
```

## Build Results ✅

```
Environment    Status    Duration
-------------  --------  ------------
esp32dev       SUCCESS   00:00:12.511   ← Firmware chính (72.7% Flash)
test_wifi      SUCCESS   00:00:10.454
test_lora_rx   SUCCESS   00:00:07.545
test_http      SUCCESS   00:00:13.181
```

## Cách sử dụng

```bash
# Trước tiên, sửa config.h:
#   WIFI_SSID, WIFI_PASSWORD, API_URL, GATEWAY_ID, GATEWAY_SECRET

# Test từng module:
pio run -e test_wifi -t upload && pio device monitor
pio run -e test_lora_rx -t upload && pio device monitor
pio run -e test_http -t upload && pio device monitor

# Flash firmware chính:
pio run -e esp32dev -t upload && pio device monitor
```

## Data Flow

```
Sensor Node ──LoRa 18B──→ onReceive() ──→ PacketBuffer ──→ HTTP POST JSON ──→ Server API
                          (parse binary)   (ring buffer)    (ArduinoJson)     /api/v1/telemetry
                          (save RSSI)      (ISR-safe)       (retry × 3)
```
