# LoRa Driver Rewrite: SX1278 (SPI) → AS32-TTL-100 (UART)

## Tại sao phải viết lại?

Module AS32-TTL-100 giao tiếp qua **UART** (transparent serial bridge), không phải SPI. Library `sandeepmistry/LoRa` chỉ hỗ trợ SPI → cần viết driver UART riêng.

## Pin Mapping

### Sensor Node (tránh xung đột DHT22/PMS7003)

| Chân AS32 | GPIO | Lý do |
|---|---|---|
| TXD → RX | **GPIO32** | Serial1 remap (Serial2 đã dùng cho PMS7003) |
| RXD ← TX | **GPIO33** | Serial1 remap |
| MD0 | **GPIO25** | Tránh GPIO4 (DHT22) |
| MD1 | **GPIO26** | Tránh GPIO15 (PMS SET) |
| AUX | **GPIO27** | Free GPIO |

### Gateway (không có xung đột)

| Chân AS32 | GPIO | Lý do |
|---|---|---|
| TXD → RX | **GPIO16** | Serial2 (không có PMS7003) |
| RXD ← TX | **GPIO17** | Serial2 |
| MD0 | **GPIO4** | Free |
| MD1 | **GPIO5** | Free |
| AUX | **GPIO13** | Free |

## Files Changed

### Sensor Node (5 files)

| File | Change |
|---|---|
| [config.h](file:///d:/datn/firmware/sensor-node/include/config.h) | SPI pins → UART pins |
| [lora_radio.h](file:///d:/datn/firmware/sensor-node/src/drivers/lora_radio.h) | Updated for AS32 |
| [lora_radio.cpp](file:///d:/datn/firmware/sensor-node/src/drivers/lora_radio.cpp) | Full rewrite: UART + AUX + mode control |
| [main.cpp](file:///d:/datn/firmware/sensor-node/src/main.cpp) | Fixed banner |
| [platformio.ini](file:///d:/datn/firmware/sensor-node/platformio.ini) | Removed `sandeepmistry/LoRa` |

### Gateway (5 files)

| File | Change |
|---|---|
| [config.h](file:///d:/datn/firmware/gateway/include/config.h) | SPI → UART pins |
| [lora_receiver.h](file:///d:/datn/firmware/gateway/src/drivers/lora_receiver.h) | `onReceive` → [lora_rx_poll()](file:///d:/datn/firmware/gateway/src/drivers/lora_receiver.cpp#70-115) |
| [lora_receiver.cpp](file:///d:/datn/firmware/gateway/src/drivers/lora_receiver.cpp) | Full rewrite: UART byte accumulation + timeout |
| [main.cpp](file:///d:/datn/firmware/gateway/src/main.cpp) | Added [lora_rx_poll()](file:///d:/datn/firmware/gateway/src/drivers/lora_receiver.cpp#70-115), fixed banner |
| [platformio.ini](file:///d:/datn/firmware/gateway/platformio.ini) | Removed `sandeepmistry/LoRa` |

### Test files (2 files)

| File | Change |
|---|---|
| [test_lora.cpp](file:///d:/datn/firmware/sensor-node/test/test_lora.cpp) | Rewrite for UART TX test |
| [test_lora_rx.cpp](file:///d:/datn/firmware/gateway/test/test_lora_rx.cpp) | Rewrite for UART RX test |

## Build Results ✅

```
SENSOR NODE  (6/6 passed)          GATEWAY  (4/4 passed)
─────────────────────────          ─────────────────────────
esp32dev     ✅ SUCCESS             esp32dev     ✅ SUCCESS
test_dht22   ✅ SUCCESS             test_wifi    ✅ SUCCESS
test_ccs811  ✅ SUCCESS             test_lora_rx ✅ SUCCESS
test_pms7003 ✅ SUCCESS             test_http    ✅ SUCCESS
test_lora    ✅ SUCCESS
test_battery ✅ SUCCESS
```

> [!NOTE]
> AS32-TTL-100 không cung cấp RSSI qua UART. Gateway gửi `rssi: 0` lên server. Nếu cần RSSI thực, phải đọc register qua sleep mode command — nhưng không cần thiết cho đồ án.
