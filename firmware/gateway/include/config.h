#pragma once

// =============================================================================
//  GATEWAY CONFIGURATION
//  Air Quality Monitoring System - Superloop Firmware
// =============================================================================

// ===== GATEWAY IDENTITY =====
#define GATEWAY_ID          "GW-001"
#define GATEWAY_SECRET      "super-secret-key"

// ===== WiFi =====
#define WIFI_SSID           "your-wifi-ssid"
#define WIFI_PASSWORD       "your-wifi-password"
#define WIFI_CONNECT_TIMEOUT_MS  15000   // Timeout kết nối lần đầu
#define WIFI_RETRY_DELAY_MS      5000    // Delay giữa các lần thử kết nối lại

// ===== API Server =====
#define API_URL             "http://your-server:3000/api/v1/telemetry"
#define API_TIMEOUT_MS      10000   // HTTP request timeout
#define HTTP_RETRY_COUNT    3       // Số lần retry khi gửi thất bại

// ===== LoRa AS32-TTL-100 (UART) — phải khớp cấu hình với Sensor Node =====
// Gateway dùng Serial2 (GPIO16/17) vì không có PMS7003
#define LORA_UART_NUM       2       // HardwareSerial(2)
#define LORA_RX_PIN         16      // ESP32 RX ← Module TXD
#define LORA_TX_PIN         17      // ESP32 TX → Module RXD
#define LORA_MD0_PIN        4       // Mode bit 0
#define LORA_MD1_PIN        5       // Mode bit 1
#define LORA_AUX_PIN        13      // AUX (LOW = module đang bận)
#define LORA_BAUD           9600    // UART baud rate (mặc định AS32)

// ===== Packet Buffer =====
#define PACKET_BUFFER_SIZE  10      // Tối đa 10 gói chờ gửi
#define FLUSH_INTERVAL_MS   30000   // Gửi HTTP mỗi 30 giây (hoặc khi buffer đầy)

// ===== Status LED =====
#define LED_WIFI_PIN        25      // LED WiFi (xanh = connected)
#define LED_STATUS_PIN      26      // LED trạng thái (nhấp nháy = đang gửi)
