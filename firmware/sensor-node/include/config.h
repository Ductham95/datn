#pragma once

// =============================================================================
//  SENSOR NODE CONFIGURATION
//  Air Quality Monitoring System - FreeRTOS Firmware
// =============================================================================

// ===== NODE IDENTITY =====
#define NODE_ID             0x01    // Thay đổi cho mỗi node: 0x01, 0x02, 0x03

// ===== LoRa SX1278 Config =====
#define LORA_FREQUENCY      433E6   // 433 MHz (Việt Nam & Châu Á)
#define LORA_SPREAD_FACTOR  7       // SF7: tốc độ nhanh, phạm vi gần (~1km ngoài trời)
#define LORA_BANDWIDTH      125E3   // 125 kHz (mặc định)
#define LORA_TX_POWER       17      // 17 dBm (công suất phát)
#define LORA_SYNC_WORD      0x12    // Sync Word chung với Gateway

// ===== LoRa SPI Pins =====
#define LORA_CS_PIN         5       // NSS / Chip Select
#define LORA_RST_PIN        14      // Reset
#define LORA_DIO0_PIN       2       // Interrupt (DIO0)

// ===== PMS7003 UART Pins =====
#define PMS_RX_PIN          16      // ESP32 RX2 ← PMS7003 TX
#define PMS_TX_PIN          17      // ESP32 TX2 → PMS7003 RX
#define PMS_SET_PIN         15      // PMS7003 SET pin (HIGH=active, LOW=sleep)

// ===== CCS811 I2C =====
#define CCS811_SDA_PIN      21      // I2C Data
#define CCS811_SCL_PIN      22      // I2C Clock
#define CCS811_ADDR         0x5A    // I2C Address (ADDR pin = LOW)

// ===== DHT22 =====
#define DHT_PIN             4       // Data pin (GPIO4)
#define DHT_TYPE            DHT22   // Sensor type

// ===== Battery ADC =====
#define BATTERY_ADC_PIN     34      // ADC1_CH6 (voltage divider: 2×100KΩ)
#define BATTERY_SAMPLES     16      // Số lần đọc ADC lấy trung bình
#define BATTERY_V_MAX       4.2f    // Điện áp pin 18650 đầy
#define BATTERY_V_MIN       3.0f    // Điện áp pin 18650 hết
#define BATTERY_V_DIVIDER   2.0f    // Hệ số voltage divider (R1=R2=100K)

// ===== Timing =====
#define SEND_INTERVAL_MS    300000  // 5 phút (300,000 ms)
#define PMS_WARMUP_MS       30000   // PMS7003 warm-up 30 giây
#define CCS811_WARMUP_MS    1200000 // CCS811 warm-up 20 phút (lần đầu bật)
#define SENSOR_READ_RETRIES 3       // Số lần retry khi đọc sensor lỗi
#define BATTERY_READ_INTERVAL_MS 30000 // Đọc pin mỗi 30 giây

// ===== FreeRTOS Task Config =====
#define SENSOR_TASK_STACK       4096
#define SENSOR_TASK_PRIORITY    2       // Cao — đọc sensor là nhiệm vụ chính
#define SENSOR_TASK_CORE        0       // Core 0

#define LORA_TASK_STACK         2048
#define LORA_TASK_PRIORITY      3       // Cao nhất — gửi xong sớm để sleep module
#define LORA_TASK_CORE          1       // Core 1 riêng (không bị sensor block)

#define BATTERY_TASK_STACK      2048
#define BATTERY_TASK_PRIORITY   1       // Thấp — đọc pin không quan trọng bằng
#define BATTERY_TASK_CORE       0       // Core 0

#define WDT_TASK_STACK          1024
#define WDT_TASK_PRIORITY       0       // Thấp nhất
#define WDT_TASK_CORE           0       // Core 0

#define DATA_QUEUE_SIZE         3       // Buffer 3 gói tin nếu LoRa đang bận
#define WDT_TIMEOUT_MS          60000   // 60 giây không heartbeat → reset ESP32
