#pragma once

// =============================================================================
//  LORA RADIO DRIVER - SX1278 (433 MHz)
//  Giao tiếp: SPI
// =============================================================================

#include <stdint.h>
#include <stdbool.h>
#include "common/packet.h"

/**
 * Khởi tạo module LoRa SX1278
 * @return true nếu khởi tạo thành công
 */
bool lora_init();

/**
 * Gửi gói tin SensorPayload (16 bytes) qua LoRa
 * @param payload Con trỏ tới struct SensorPayload
 * @return true nếu gửi thành công
 */
bool lora_sendPacket(const SensorPayload* payload);

/**
 * Đưa module LoRa vào chế độ sleep để tiết kiệm pin
 */
void lora_sleep();

/**
 * Đánh thức module LoRa từ chế độ sleep
 */
void lora_wakeup();
