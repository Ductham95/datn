#include <Arduino.h>
#include "config.h"
#include "common/debug.h"
#include "common/packet.h"

// Drivers
#include "drivers/wifi_manager.h"
#include "drivers/lora_receiver.h"

// Core
#include "core/packet_buffer.h"

// Network
#include "net/http_client.h"

// =============================================================================
//  MAIN.CPP - Air Quality Gateway (Superloop)
//
//  Kiến trúc:
//    setup() → Init WiFi + LoRa + Buffer + LED
//    loop()  → WiFi reconnect + Buffer flush + HTTP POST
//
//  LoRa nhận gói tin qua UART polling (AS32-TTL-100)
//  loop() poll UART + kiểm tra buffer + gửi HTTP khi cần
// =============================================================================

static unsigned long lastFlushTime = 0;

// ===== LED Helper =====
void led_init() {
    pinMode(LED_WIFI_PIN, OUTPUT);
    pinMode(LED_STATUS_PIN, OUTPUT);
    digitalWrite(LED_WIFI_PIN, LOW);
    digitalWrite(LED_STATUS_PIN, LOW);
}

void led_update() {
    // LED WiFi: sáng = connected, tắt = disconnected
    digitalWrite(LED_WIFI_PIN, wifi_isConnected() ? HIGH : LOW);
}

// ===== Flush buffer → HTTP POST =====
void flushBufferToServer() {
    uint8_t count = buffer_count();
    if (count == 0) return;

    // Chỉ gửi khi có WiFi
    if (!wifi_isConnected()) {
        LOG_MSG("GATEWAY", "⚠ Chưa có WiFi, giữ gói tin trong buffer.");
        return;
    }

    // Lấy tất cả gói ra khỏi buffer
    BufferedPacket packets[PACKET_BUFFER_SIZE];
    uint8_t flushed = buffer_flush(packets, PACKET_BUFFER_SIZE);

    LOG_SEPARATOR();
    LOG_INFO("GATEWAY", "Flush %d gói tin → Server", flushed);

    // Hiển thị chi tiết từng gói
    for (uint8_t i = 0; i < flushed; i++) {
        const SensorPayload* p = &packets[i].payload;
        const char* typeStr = (p->pktType == PKT_TYPE_DATA) ? "DATA" :
                              (p->pktType == PKT_TYPE_HEARTBEAT) ? "HB" : "ERR";

        LOG_INFO("GATEWAY", "  [%d] Node:0x%02X Type:%s MsgID:%d RSSI:%d dBm",
                  i + 1, p->nodeId, typeStr, p->msgId, packets[i].rssi);
    }

    // LED nhấp nháy = đang gửi
    digitalWrite(LED_STATUS_PIN, HIGH);

    bool success = http_sendBatch(packets, flushed);

    digitalWrite(LED_STATUS_PIN, LOW);

    if (!success) {
        // Gửi thất bại → đẩy lại vào buffer (nếu còn chỗ)
        LOG_MSG("GATEWAY", "⚠ Gửi thất bại! Đẩy lại gói tin vào buffer...");
        for (uint8_t i = 0; i < flushed; i++) {
            if (!buffer_push(&packets[i].payload, packets[i].rssi)) {
                LOG_INFO("GATEWAY", "🔴 Mất gói tin Node:0x%02X MsgID:%d (buffer đầy)",
                          packets[i].payload.nodeId, packets[i].payload.msgId);
            }
        }
    }

    LOG_SEPARATOR();
}

// ===== Setup =====
void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println();
    Serial.println("========================================");
    Serial.println("  AIR QUALITY GATEWAY (Superloop)");
    Serial.printf("  Gateway ID : %s\n", GATEWAY_ID);
    Serial.printf("  LoRa       : AS32-TTL-100 (UART %d baud)\n", LORA_BAUD);
    Serial.printf("  API Server : %s\n", API_URL);
    Serial.printf("  Flush      : Mỗi %d giây hoặc buffer đầy (%d gói)\n",
                  FLUSH_INTERVAL_MS / 1000, PACKET_BUFFER_SIZE);
    Serial.println("========================================");
    Serial.println();

    // 1. LED
    led_init();

    // 2. Packet Buffer
    buffer_init();

    // 3. WiFi
    Serial.println("[1/3] Kết nối WiFi...");
    if (!wifi_init()) {
        Serial.println("[WARN] WiFi chưa kết nối. Sẽ thử lại trong loop.");
    }

    // 4. LoRa Receiver
    Serial.println("[2/3] Khởi tạo LoRa Receiver...");
    if (!lora_rx_init()) {
        Serial.println("[ERROR] LoRa THẤT BẠI! Restart...");
        delay(3000);
        esp_restart();
    }

    Serial.println("[3/3] Setup hoàn tất!");
    Serial.println();
    Serial.println("========================================");
    Serial.println("  [OK] Gateway đang hoạt động!");
    Serial.println("  Chờ nhận gói tin LoRa từ Sensor Node...");
    Serial.println("========================================");
    Serial.println();

    lastFlushTime = millis();
}

// ===== Main Loop (Superloop) =====
void loop() {
    // 1. WiFi: auto-reconnect nếu mất
    wifi_reconnectIfNeeded();

    // 2. LoRa: poll UART để nhận gói tin
    lora_rx_poll();

    // 3. Kiểm tra điều kiện flush buffer → HTTP POST
    bool shouldFlush = false;

    // Điều kiện 1: Buffer đầy
    if (buffer_isFull()) {
        LOG_MSG("GATEWAY", "Buffer đầy → Flush ngay!");
        shouldFlush = true;
    }

    // Điều kiện 2: Đã qua FLUSH_INTERVAL_MS kể từ lần flush cuối VÀ có data
    if (!shouldFlush && buffer_count() > 0) {
        if (millis() - lastFlushTime >= FLUSH_INTERVAL_MS) {
            LOG_MSG("GATEWAY", "Timeout → Flush buffer.");
            shouldFlush = true;
        }
    }

    if (shouldFlush) {
        flushBufferToServer();
        lastFlushTime = millis();
    }

    // 4. Cập nhật LED
    led_update();

    // 5. Yield cho WiFi stack
    delay(50);  // 50ms — đủ nhanh để không miss gói LoRa UART
}
