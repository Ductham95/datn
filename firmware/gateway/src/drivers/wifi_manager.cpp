#include "wifi_manager.h"
#include <Arduino.h>
#include <WiFi.h>
#include "config.h"
#include "common/debug.h"
#include "core/nvs_config.h"

// =============================================================================
//  WIFI MANAGER IMPLEMENTATION
//  Kết nối WiFi STA mode, auto-reconnect khi mất kết nối
//  Dùng biến runtime từ NVS (cfg_wifiSsid, cfg_wifiPassword)
// =============================================================================

static unsigned long lastReconnectAttempt = 0;
static char ipBuffer[16] = "0.0.0.0";

bool wifi_init() {
    WiFi.mode(WIFI_STA);
    WiFi.setAutoReconnect(true);
    WiFi.begin(cfg_wifiSsid, cfg_wifiPassword);

    LOG_INFO("WiFi", "Đang kết nối '%s'", cfg_wifiSsid);

    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED) {
        if (millis() - start > WIFI_CONNECT_TIMEOUT_MS) {
            LOG_MSG("WiFi", "❌ Timeout! Không kết nối được WiFi.");
            return false;
        }
        Serial.print(".");
        delay(500);
    }
    Serial.println();

    // Cache IP address
    IPAddress ip = WiFi.localIP();
    snprintf(ipBuffer, sizeof(ipBuffer), "%d.%d.%d.%d", ip[0], ip[1], ip[2], ip[3]);

    LOG_INFO("WiFi", "✅ Đã kết nối! IP: %s, RSSI: %d dBm", ipBuffer, WiFi.RSSI());
    return true;
}

bool wifi_isConnected() {
    return WiFi.status() == WL_CONNECTED;
}

void wifi_reconnectIfNeeded() {
    if (wifi_isConnected()) return;

    unsigned long now = millis();
    if (now - lastReconnectAttempt < WIFI_RETRY_DELAY_MS) return;

    lastReconnectAttempt = now;
    LOG_MSG("WiFi", "⚠ Mất kết nối! Đang thử kết nối lại...");

    WiFi.disconnect();
    WiFi.begin(cfg_wifiSsid, cfg_wifiPassword);

    // Non-blocking: chỉ thử 1 lần, kiểm tra lại ở loop sau
    delay(100);
    if (wifi_isConnected()) {
        IPAddress ip = WiFi.localIP();
        snprintf(ipBuffer, sizeof(ipBuffer), "%d.%d.%d.%d", ip[0], ip[1], ip[2], ip[3]);
        LOG_INFO("WiFi", "✅ Kết nối lại thành công! IP: %s", ipBuffer);
    }
}

int32_t wifi_getRSSI() {
    return WiFi.RSSI();
}

const char* wifi_getIP() {
    return ipBuffer;
}
