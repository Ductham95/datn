#include "sensor_task.h"
#include <Arduino.h>
#include "config.h"
#include "common/debug.h"
#include "common/packet.h"
#include "rtos/shared.h"
#include "drivers/pms7003.h"
#include "drivers/ccs811.h"
#include "drivers/dht22.h"

// =============================================================================
//  SENSOR TASK IMPLEMENTATION
//  Chu kỳ hoạt động:
//    1. Bật PMS7003 fan (warm-up)
//    2. Đọc DHT22 + CCS811 song song với warm-up (tiết kiệm ~3s)
//    3. Chờ PMS7003 warm-up xong → đọc PM2.5/PM10
//    4. Đóng gói SensorPayload → gửi vào Queue
//    5. Ngủ 5 phút
// =============================================================================

void sensorTask(void* parameter) {
    SensorPayload payload;
    TickType_t warmupStart;

    LOG_INFO("TASK", "SensorTask started (Core %d)", xPortGetCoreID());

    while (true) {
        // ── Heartbeat cho WatchdogTask ──
        taskHeartbeat[TASK_SENSOR] = xTaskGetTickCount();

        LOG_SEPARATOR();
        LOG_MSG("SENSOR", "━━ Bắt đầu chu kỳ đo ━━");

        // Xoá payload trước mỗi chu kỳ
        memset(&payload, 0, sizeof(SensorPayload));

        // ═══════════════════════════════════════════
        // Giai đoạn 1: Bật PMS7003 warm-up
        // ═══════════════════════════════════════════
        pms7003_powerOn();
        warmupStart = xTaskGetTickCount();

        // ═══════════════════════════════════════════
        // Giai đoạn 2: Đọc DHT22 + CCS811 (song song với PMS warm-up)
        // ═══════════════════════════════════════════
        LOG_MSG("SENSOR", "Đọc DHT22 + CCS811 trong khi PMS warm-up...");

        // Đọc DHT22 trước → dùng kết quả bù trừ CCS811
        int16_t  temp = SENSOR_ERROR_I16;
        uint16_t hum  = SENSOR_ERROR_U16;
        dht22_read(&temp, &hum);
        payload.temperature = temp;
        payload.humidity    = hum;

        // Cung cấp env data cho CCS811 (compensation)
        if (temp != SENSOR_ERROR_I16 && hum != SENSOR_ERROR_U16) {
            ccs811_setEnvData(temp, hum);
        }

        // Đọc CCS811
        uint16_t co2  = 0;
        uint16_t tvoc = 0;
        ccs811_read(&co2, &tvoc);
        payload.co2  = co2;
        payload.tvoc = tvoc;

        // ═══════════════════════════════════════════
        // Chờ PMS7003 warm-up xong
        // ═══════════════════════════════════════════
        TickType_t elapsed = xTaskGetTickCount() - warmupStart;
        TickType_t remaining = pdMS_TO_TICKS(PMS_WARMUP_MS) - elapsed;
        if (remaining > 0 && remaining < pdMS_TO_TICKS(PMS_WARMUP_MS)) {
            LOG_INFO("SENSOR", "Chờ PMS warm-up thêm %lu ms...",
                       (unsigned long)(remaining * portTICK_PERIOD_MS));
            vTaskDelay(remaining);
        }

        // ═══════════════════════════════════════════
        // Giai đoạn 3: Đọc PMS7003
        // ═══════════════════════════════════════════
        uint16_t pm25 = SENSOR_ERROR_U16;
        uint16_t pm10 = SENSOR_ERROR_U16;
        pms7003_read(&pm25, &pm10);
        payload.pm25 = pm25;
        payload.pm10 = pm10;

        // Tắt quạt PMS7003 để tiết kiệm pin
        pms7003_powerOff();

        // ═══════════════════════════════════════════
        // Giai đoạn 4: Đóng gói header + gửi vào Queue
        // ═══════════════════════════════════════════
        payload.nodeId  = NODE_ID;
        payload.pktType = PKT_TYPE_DATA;
        payload.msgId   = msgCounter++;
        payload.battery = batteryLevel;  // Lấy từ BatteryTask

        // Gửi vào Queue (timeout 1 giây)
        if (xQueueSend(dataQueue, &payload, pdMS_TO_TICKS(1000)) == pdTRUE) {
            LOG_INFO("SENSOR", "→ Queue OK (MsgID: %d)", payload.msgId);
        } else {
            LOG_MSG("SENSOR", "⚠ Queue đầy! Bỏ gói tin này.");
        }

        // Log tổng hợp
        LOG_MSG("SENSOR", "━━ Kết thúc chu kỳ đo ━━");
        LOG_INFO("SENSOR", "PM2.5:%.1f PM10:%.1f CO2:%d TVOC:%d T:%.1f H:%.1f Bat:%d%%",
            payload.pm25 == SENSOR_ERROR_U16 ? -1.0f : payload.pm25 / 10.0f,
            payload.pm10 == SENSOR_ERROR_U16 ? -1.0f : payload.pm10 / 10.0f,
            payload.co2, payload.tvoc,
            payload.temperature == SENSOR_ERROR_I16 ? -99.9f : payload.temperature / 10.0f,
            payload.humidity == SENSOR_ERROR_U16 ? -1.0f : payload.humidity / 10.0f,
            payload.battery);

        // ═══════════════════════════════════════════
        // Giai đoạn 5: Ngủ đến chu kỳ tiếp theo
        // ═══════════════════════════════════════════
        LOG_INFO("SENSOR", "Ngủ %d phút...", SEND_INTERVAL_MS / 60000);
        vTaskDelay(pdMS_TO_TICKS(SEND_INTERVAL_MS - PMS_WARMUP_MS));
    }
}
