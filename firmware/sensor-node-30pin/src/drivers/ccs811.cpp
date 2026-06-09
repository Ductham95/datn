#include "ccs811.h"
#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_CCS811.h>
#include "config.h"
#include "common/debug.h"
#include "common/packet.h"

// =============================================================================
//  CCS811 DRIVER IMPLEMENTATION (30-pin board)
//  Dải đo: eCO2 400-8192 ppm, eTVOC 0-1187 ppb
//  Lưu ý: Cần warm-up ~20 phút để dữ liệu chính xác
//
//  Board 30 chân: thêm CCS811_WAK_PIN và CCS811_ADD_PIN
//  Chung bus I2C với OLED → cần bus recovery khi lỗi
// =============================================================================

static Adafruit_CCS811 ccs;
static unsigned long ccs811StartTime = 0;

// Số lần retry riêng cho CCS811 (cao hơn SENSOR_READ_RETRIES vì bus bị nhiễu OLED)
#define CCS811_MAX_RETRIES 5

/**
 * Phục hồi bus I2C khi bị kẹt (stuck SDA LOW)
 * Toggle SCL thủ công để giải phóng slave đang giữ bus
 */
static void i2c_busRecovery() {
    Wire.end();
    pinMode(CCS811_SDA_PIN, INPUT_PULLUP);
    pinMode(CCS811_SCL_PIN, OUTPUT);

    // Toggle SCL 9 lần để unstick slave
    for (int i = 0; i < 9; i++) {
        digitalWrite(CCS811_SCL_PIN, LOW);
        delayMicroseconds(100);
        digitalWrite(CCS811_SCL_PIN, HIGH);
        delayMicroseconds(100);
    }

    // Khởi tạo lại Wire
    Wire.begin(CCS811_SDA_PIN, CCS811_SCL_PIN);
    Wire.setClock(10000);
    Wire.setTimeOut(3000);
    delay(50);
    LOG_MSG("CCS811", "Bus I2C recovery done.");
}

bool ccs811_init() {
    // Khởi tạo chân điều khiển CCS811 (theo AirMonitorModule)
    pinMode(CCS811_WAK_PIN, OUTPUT);
    pinMode(CCS811_ADD_PIN, OUTPUT);
    digitalWrite(CCS811_WAK_PIN, LOW);   // Wake sensor (active LOW)
    digitalWrite(CCS811_ADD_PIN, LOW);   // Address = 0x5A
    delay(200);  // Đợi CCS811 boot sau khi wake (datasheet: ~70ms app start)

    // Wire đã được khởi tạo trong initAllHardware()

    if (!ccs.begin(CCS811_ADDR)) {
        LOG_MSG("CCS811", "THẤT BẠI! Không tìm thấy sensor.");
        return false;
    }

    // Đợi sensor sẵn sàng
    while (!ccs.available()) {
        delay(100);
    }

    // Drive mode 1: đo mỗi 1 giây
    ccs.setDriveMode(CCS811_DRIVE_MODE_1SEC);

    ccs811StartTime = millis();
    LOG_MSG("CCS811", "Khởi tạo... OK!");
    LOG_MSG("CCS811", "Cần warm-up 20 phút để dữ liệu chính xác.");
    return true;
}

void ccs811_setEnvData(int16_t temperature, uint16_t humidity) {
    // Chuyển đổi lại từ ×10 sang float
    float tempC = temperature / 10.0f;
    float humPct = humidity / 10.0f;

    ccs.setEnvironmentalData(humPct, tempC);
    LOG_INFO("CCS811", "ENV compensation: T=%.1f°C, H=%.1f%%", tempC, humPct);
}

bool ccs811_read(uint16_t* co2, uint16_t* tvoc) {
    *co2  = 0;
    *tvoc = 0;

    int consecutiveErrors = 0;

    for (int attempt = 1; attempt <= CCS811_MAX_RETRIES; attempt++) {
        if (ccs.available()) {
            uint8_t err = ccs.readData();
            if (err == 0) {
                *co2  = ccs.geteCO2();
                *tvoc = ccs.getTVOC();

                // Lọc data rác do I2C glitch (ESP32 clock stretching bug)
                if (*co2 > 8192 || *tvoc > 1187) {
                    LOG_INFO("CCS811", "⚠ Data rác (CO2:%d, TVOC:%d), đọc lại...", *co2, *tvoc);
                    *co2  = 0;
                    *tvoc = 0;
                    consecutiveErrors++;
                    delay(500);
                    continue;
                }

                LOG_INFO("CCS811", "CO2: %d ppm | TVOC: %d ppb", *co2, *tvoc);
                if (!ccs811_isWarmedUp()) {
                    LOG_MSG("CCS811", "⚠ Chưa warm-up đủ 20 phút, dữ liệu có thể chưa chính xác");
                }
                return true;
            } else {
                LOG_INFO("CCS811", "Lỗi đọc (err=%d), thử lại %d/%d",
                           err, attempt, CCS811_MAX_RETRIES);
                consecutiveErrors++;
            }
        } else {
            LOG_INFO("CCS811", "Chưa sẵn sàng, thử lại %d/%d",
                       attempt, CCS811_MAX_RETRIES);
            consecutiveErrors++;
        }

        // Nếu lỗi liên tiếp >= 3 lần → bus có thể bị kẹt, thực hiện recovery
        if (consecutiveErrors >= 3) {
            LOG_MSG("CCS811", "⚠ I2C bus có thể bị kẹt, đang recovery...");
            i2c_busRecovery();
            consecutiveErrors = 0;
        }

        delay(1000);
    }

    LOG_MSG("CCS811", "THẤT BẠI! Trả về 0");
    return false;
}

bool ccs811_isWarmedUp() {
    return (millis() - ccs811StartTime) >= CCS811_WARMUP_MS;
}

