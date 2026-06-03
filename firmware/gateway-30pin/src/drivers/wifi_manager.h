#pragma once
#include <stdbool.h>
#include <stdint.h>

// =============================================================================
//  WIFI MANAGER - Kết nối WiFi + Auto-reconnect
// =============================================================================

/**
 * Kết nối WiFi (blocking, timeout theo WIFI_CONNECT_TIMEOUT_MS)
 * @return true nếu kết nối thành công
 */
bool wifi_init();

/**
 * Kiểm tra kết nối WiFi hiện tại
 */
bool wifi_isConnected();

/**
 * Tự động kết nối lại nếu mất WiFi
 * Gọi trong loop(), non-blocking (dùng millis timer)
 */
void wifi_reconnectIfNeeded();

/**
 * Lấy RSSI tín hiệu WiFi (dBm)
 */
int32_t wifi_getRSSI();

/**
 * Lấy IP address dạng String
 */
const char* wifi_getIP();
