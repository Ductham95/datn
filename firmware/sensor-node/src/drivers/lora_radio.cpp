#include "lora_radio.h"
#include <Arduino.h>
#include <LoRa.h>
#include <SPI.h>
#include "config.h"
#include "common/debug.h"

// =============================================================================
//  LORA RADIO DRIVER IMPLEMENTATION
//  Module: SX1278 (Ra-02), 433 MHz
//  Gửi struct SensorPayload 16 bytes dạng binary (không dùng JSON)
// =============================================================================

bool lora_init() {
    // Cấu hình SPI pins cho LoRa
    LoRa.setPins(LORA_CS_PIN, LORA_RST_PIN, LORA_DIO0_PIN);

    if (!LoRa.begin(LORA_FREQUENCY)) {
        LOG_MSG("LoRa", "THẤT BẠI! Kiểm tra kết nối SPI và anten.");
        return false;
    }

    // Cấu hình thông số LoRa
    LoRa.setSpreadingFactor(LORA_SPREAD_FACTOR);
    LoRa.setSignalBandwidth(LORA_BANDWIDTH);
    LoRa.setTxPower(LORA_TX_POWER);
    LoRa.setSyncWord(LORA_SYNC_WORD);
    LoRa.enableCrc();  // Bật CRC ở tầng PHY

    LOG_MSG("LoRa", "Khởi tạo... OK!");
    LOG_INFO("LoRa", "  Freq: %.0f MHz, SF: %d, BW: %.0f kHz, TxPower: %d dBm",
                LORA_FREQUENCY / 1E6,
                LORA_SPREAD_FACTOR,
                LORA_BANDWIDTH / 1E3,
                LORA_TX_POWER);

    return true;
}

bool lora_sendPacket(const SensorPayload* payload) {
    // Đánh thức module nếu đang sleep
    lora_wakeup();

    LoRa.beginPacket();
    LoRa.write((const uint8_t*)payload, sizeof(SensorPayload));

    int result = LoRa.endPacket();  // Blocking cho đến khi gửi xong

    if (result == 1) {
        LOG_INFO("LoRa", "Đã gửi %d bytes (MsgID: %d, PktType: 0x%02X)",
                    sizeof(SensorPayload), payload->msgId, payload->pktType);
        return true;
    } else {
        LOG_MSG("LoRa", "Gửi THẤT BẠI!");
        return false;
    }
}

void lora_sleep() {
    LoRa.sleep();
    LOG_MSG("LoRa", "Module sleep");
}

void lora_wakeup() {
    LoRa.idle();  // Chuyển từ sleep → idle (sẵn sàng gửi/nhận)
}
