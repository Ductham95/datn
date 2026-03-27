#include "lora_task.h"
#include <Arduino.h>
#include "config.h"
#include "common/debug.h"
#include "common/packet.h"
#include "rtos/shared.h"
#include "drivers/lora_radio.h"

// =============================================================================
//  LORA TASK IMPLEMENTATION
//  - Chờ data từ Queue (event-driven, không polling)
//  - Gửi xong → đưa LoRa module vào sleep mode
//  - Nếu timeout 10 phút không có data → gửi Heartbeat
// =============================================================================

#define LORA_QUEUE_TIMEOUT_MS  600000  // 10 phút timeout
#define LORA_SEND_RETRIES      2       // Số lần retry gửi LoRa

void loraTask(void* parameter) {
    SensorPayload rxPayload;

    LOG_INFO("TASK", "LoRaTask started (Core %d)", xPortGetCoreID());

    while (true) {
        // ── Heartbeat cho WatchdogTask ──
        taskHeartbeat[TASK_LORA] = xTaskGetTickCount();

        // Block chờ data từ SensorTask (Queue)
        if (xQueueReceive(dataQueue, &rxPayload, pdMS_TO_TICKS(LORA_QUEUE_TIMEOUT_MS)) == pdTRUE) {
            // ═══ Nhận được data → gửi LoRa ═══
            bool sent = false;

            for (int attempt = 1; attempt <= LORA_SEND_RETRIES; attempt++) {
                if (lora_sendPacket(&rxPayload)) {
                    sent = true;
                    LOG_INFO("LoRa TX", "MsgID:%d PM2.5:%.1f PM10:%.1f CO2:%d TVOC:%d T:%.1f H:%.1f Bat:%d%%",
                        rxPayload.msgId,
                        rxPayload.pm25 == SENSOR_ERROR_U16 ? -1.0f : rxPayload.pm25 / 10.0f,
                        rxPayload.pm10 == SENSOR_ERROR_U16 ? -1.0f : rxPayload.pm10 / 10.0f,
                        rxPayload.co2, rxPayload.tvoc,
                        rxPayload.temperature == SENSOR_ERROR_I16 ? -99.9f : rxPayload.temperature / 10.0f,
                        rxPayload.humidity == SENSOR_ERROR_U16 ? -1.0f : rxPayload.humidity / 10.0f,
                        rxPayload.battery);
                    break;
                }
                LOG_INFO("LoRa TX", "Gửi lỗi, thử lại %d/%d", attempt, LORA_SEND_RETRIES);
                vTaskDelay(pdMS_TO_TICKS(500));
            }

            if (!sent) {
                LOG_INFO("LoRa TX", "Gửi THẤT BẠI sau %d lần thử! Bỏ gói tin.", LORA_SEND_RETRIES);
            }

        } else {
            // ═══ Timeout → gửi Heartbeat ═══
            SensorPayload heartbeat;
            memset(&heartbeat, 0, sizeof(SensorPayload));
            heartbeat.nodeId  = NODE_ID;
            heartbeat.pktType = PKT_TYPE_HEARTBEAT;
            heartbeat.msgId   = msgCounter++;
            heartbeat.battery = batteryLevel;

            if (lora_sendPacket(&heartbeat)) {
                LOG_INFO("LoRa TX", "Heartbeat sent (Bat: %d%%)", heartbeat.battery);
            } else {
                LOG_MSG("LoRa TX", "⚠ Heartbeat gửi thất bại!");
            }
        }

        // Đưa LoRa module vào sleep mode sau khi gửi xong
        lora_sleep();
    }
}
