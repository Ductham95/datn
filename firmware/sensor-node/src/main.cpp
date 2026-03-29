#include <Arduino.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <freertos/queue.h>

#include "config.h"
#include "common/packet.h"
#include "common/debug.h"
#include "rtos/shared.h"

// Drivers
#include "drivers/lora_radio.h"
#include "drivers/pms7003.h"
#include "drivers/ccs811.h"
#include "drivers/dht22.h"
#include "drivers/battery_adc.h"

// FreeRTOS Tasks
#include "tasks/sensor_task.h"
#include "tasks/lora_task.h"
#include "tasks/battery_task.h"
#include "tasks/watchdog_task.h"

// =============================================================================
//  MAIN.CPP - Air Quality Monitoring Sensor Node (FreeRTOS)
//
//  Kiến trúc:
//    setup() → Init tất cả driver → Tạo Queue → Tạo 4 FreeRTOS tasks
//    loop()  → Trống (xóa task để giải phóng stack)
//
//  Tasks:
//    SensorTask  (Core 0, Priority 2) - Đọc PMS7003 + CCS811 + DHT22
//    LoRaTask    (Core 1, Priority 3) - Gửi LoRa (event-driven từ Queue)
//    BatteryTask (Core 0, Priority 1) - Đọc ADC pin mỗi 30s
//    WatchdogTask(Core 0, Priority 0) - Giám sát heartbeat
// =============================================================================

// ===== FreeRTOS Shared Resources (định nghĩa từ shared.h) =====
QueueHandle_t       dataQueue = NULL;
volatile uint8_t    batteryLevel = 0;
volatile TickType_t taskHeartbeat[TASK_COUNT] = {0};
RTC_DATA_ATTR uint8_t msgCounter = 0;

// ===== Khởi tạo tất cả phần cứng =====
bool initAllHardware() {
    bool allOk = true;

    // LoRa SX1278 (SPI)
    Serial.print("[LoRa] Đang khởi tạo... ");
    if (lora_init()) {
        Serial.println("OK!");
    } else {
        Serial.println("THẤT BẠI!");
        allOk = false;
    }

    // PMS7003 (UART2)
    Serial.print("[PMS7003] Đang khởi tạo... ");
    if (pms7003_init()) {
        Serial.println("OK!");
    } else {
        Serial.println("THẤT BẠI!");
        allOk = false;
    }

    // CCS811 (I2C)
    Serial.print("[CCS811] Đang khởi tạo... ");
    if (ccs811_init()) {
        Serial.println("OK!");
    } else {
        Serial.println("THẤT BẠI!");
        allOk = false;
    }

    // DHT22 (GPIO)
    Serial.print("[DHT22] Đang khởi tạo... ");
    if (dht22_init()) {
        Serial.println("OK!");
    } else {
        Serial.println("THẤT BẠI!");
        allOk = false;
    }

    // Battery ADC
    battery_init();
    Serial.println("[Battery] ADC OK!");

    return allOk;
}

void setup() {
    Serial.begin(115200);
    delay(1000);  // Đợi Serial ổn định

    // ── Banner khởi động ──
    Serial.println();
    Serial.println("========================================");
    Serial.println("  AIR QUALITY SENSOR NODE (FreeRTOS)");
    Serial.printf("  Node ID  : 0x%02X\n", NODE_ID);
    Serial.printf("  Interval : %d phút\n", SEND_INTERVAL_MS / 60000);
    Serial.printf("  LoRa     : AS32-TTL-100 (UART %d baud)\n", LORA_BAUD);
    Serial.println("========================================");

    // ── 1. Init tất cả phần cứng ──
    bool hwOk = initAllHardware();

    if (hwOk) {
        Serial.println("[OK] Tất cả module đã khởi tạo xong!");
    } else {
        Serial.println("[WARN] Một số module khởi tạo lỗi. Tiếp tục với chức năng có sẵn...");
    }

    // ── 2. Tạo FreeRTOS Queue ──
    dataQueue = xQueueCreate(DATA_QUEUE_SIZE, sizeof(SensorPayload));
    if (dataQueue == NULL) {
        Serial.println("[ERROR] Không tạo được Queue! Restart...");
        delay(3000);
        esp_restart();
    }
    Serial.printf("[Queue] Tạo Queue thành công (%d slots × %d bytes)\n",
                  DATA_QUEUE_SIZE, sizeof(SensorPayload));

    // ── 3. Tạo FreeRTOS Tasks ──
    Serial.println("[RTOS] Đang tạo tasks...");

    BaseType_t ret;

    ret = xTaskCreatePinnedToCore(
        sensorTask, "Sensor",
        SENSOR_TASK_STACK, NULL,
        SENSOR_TASK_PRIORITY, NULL,
        SENSOR_TASK_CORE
    );
    Serial.printf("  SensorTask  : %s (Core %d, Priority %d, Stack %d)\n",
                  ret == pdPASS ? "OK" : "FAIL",
                  SENSOR_TASK_CORE, SENSOR_TASK_PRIORITY, SENSOR_TASK_STACK);

    ret = xTaskCreatePinnedToCore(
        loraTask, "LoRa",
        LORA_TASK_STACK, NULL,
        LORA_TASK_PRIORITY, NULL,
        LORA_TASK_CORE
    );
    Serial.printf("  LoRaTask    : %s (Core %d, Priority %d, Stack %d)\n",
                  ret == pdPASS ? "OK" : "FAIL",
                  LORA_TASK_CORE, LORA_TASK_PRIORITY, LORA_TASK_STACK);

    ret = xTaskCreatePinnedToCore(
        batteryTask, "Battery",
        BATTERY_TASK_STACK, NULL,
        BATTERY_TASK_PRIORITY, NULL,
        BATTERY_TASK_CORE
    );
    Serial.printf("  BatteryTask : %s (Core %d, Priority %d, Stack %d)\n",
                  ret == pdPASS ? "OK" : "FAIL",
                  BATTERY_TASK_CORE, BATTERY_TASK_PRIORITY, BATTERY_TASK_STACK);

    ret = xTaskCreatePinnedToCore(
        watchdogTask, "WDT",
        WDT_TASK_STACK, NULL,
        WDT_TASK_PRIORITY, NULL,
        WDT_TASK_CORE
    );
    Serial.printf("  WatchdogTask: %s (Core %d, Priority %d, Stack %d)\n",
                  ret == pdPASS ? "OK" : "FAIL",
                  WDT_TASK_CORE, WDT_TASK_PRIORITY, WDT_TASK_STACK);

    Serial.println();
    Serial.println("========================================");
    Serial.println("  [OK] Hệ thống đã sẵn sàng!");
    Serial.println("  Tất cả logic chạy trong FreeRTOS tasks.");
    Serial.println("========================================");
    Serial.println();
}

void loop() {
    // Tất cả logic nằm trong FreeRTOS tasks
    // Xóa loop task để giải phóng stack (~8KB)
    vTaskDelete(NULL);
}
