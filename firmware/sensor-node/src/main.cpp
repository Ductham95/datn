/*
 * =====================================================
 * HỆ THỐNG GIÁM SÁT CHẤT LƯỢNG KHÔNG KHÍ ĐÔ THỊ
 * Firmware: Sensor Node
 * MCU: ESP32 DevKit V1
 * Sensors: PMS7003 (PM2.5/PM10) + CCS811 (CO2/TVOC) + DHT22 (Temp/Hum)
 * Communication: LoRa SX1278 @ 433MHz
 * =====================================================
 */

#include <Arduino.h>
#include <SPI.h>
#include <LoRa.h>
#include <PMS.h>
#include <Adafruit_CCS811.h>
#include <DHT.h>

// ==================== CẤU HÌNH NODE ====================
#define NODE_ID           0x01    // ID node (thay đổi cho mỗi node: 0x01, 0x02, 0x03)
#define SEND_INTERVAL_MS  300000  // Gửi mỗi 5 phút (300000ms)
#define ENABLE_DEEP_SLEEP true    // Bật Deep Sleep để tiết kiệm pin

// ==================== PIN DEFINITIONS ====================
// LoRa SX1278 (SPI)
#define LORA_SCK    18
#define LORA_MISO   19
#define LORA_MOSI   23
#define LORA_CS     5
#define LORA_RST    14
#define LORA_DIO0   2

// PMS7003 (UART2)
#define PMS_RX      16   // ESP32 RX2 <- PMS7003 TX
#define PMS_TX      17   // ESP32 TX2 -> PMS7003 RX

// DHT22
#define DHT_PIN     4
#define DHT_TYPE    DHT22

// CCS811 (I2C - default SDA=21, SCL=22)
// Địa chỉ mặc định: 0x5A

// Battery ADC
#define BATTERY_PIN 34   // ADC pin đo điện áp pin

// ==================== LoRa CONFIGURATION ====================
#define LORA_FREQUENCY    433E6   // 433 MHz
#define LORA_BANDWIDTH    125E3   // 125 kHz
#define LORA_SPREAD_FACTOR 7      // SF7 (tốc độ nhanh, tầm ngắn hơn)
#define LORA_TX_POWER     17      // dBm (max 20)
#define LORA_SYNC_WORD    0x12    // Sync word riêng cho mạng

// ==================== PACKET STRUCTURE ====================
// Total: 14 bytes
// [NodeID:1][PktType:1][PM25:2][PM10:2][CO2:2][TVOC:2][Temp:2][Hum:2][Bat:1]
#define PKT_TYPE_DATA     0x01
#define PKT_TYPE_HEARTBEAT 0x02
#define PACKET_SIZE       15

// ==================== KHỞI TẠO ĐỐI TƯỢNG ====================
HardwareSerial pmsSerial(2);       // UART2 cho PMS7003
PMS pms(pmsSerial);
PMS::DATA pmsData;

Adafruit_CCS811 ccs811;
DHT dht(DHT_PIN, DHT_TYPE);

// ==================== BIẾN TOÀN CỤC ====================
bool ccs811Ready = false;
unsigned long ccs811StartTime = 0;
#define CCS811_WARMUP_MS  1200000  // 20 phút warm-up

// Dữ liệu cảm biến
struct SensorData {
  uint16_t pm25;      // µg/m³ × 10
  uint16_t pm10;      // µg/m³ × 10
  uint16_t co2;       // ppm
  uint16_t tvoc;      // ppb
  int16_t  temperature; // °C × 10
  uint16_t humidity;   // % × 10
  uint8_t  battery;    // 0-100%
};

// ==================== FUNCTION DECLARATIONS ====================
void setupLoRa();
void setupPMS();
void setupCCS811();
void setupDHT();
bool readPMS(SensorData &data);
bool readCCS811(SensorData &data);
bool readDHT(SensorData &data);
uint8_t readBattery();
void sendLoRaPacket(const SensorData &data);
void enterDeepSleep();
void printSensorData(const SensorData &data);

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println(F("========================================"));
  Serial.println(F("  AIR QUALITY MONITORING - SENSOR NODE"));
  Serial.printf("  Node ID: 0x%02X\n", NODE_ID);
  Serial.println(F("========================================"));

  // Khởi tạo các module
  setupLoRa();
  setupPMS();
  setupCCS811();
  setupDHT();

  // Cấu hình ADC cho battery
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  Serial.println(F("[OK] Tất cả module đã khởi tạo xong!"));
  Serial.println();
}

// ==================== LOOP ====================
void loop() {
  SensorData data = {0};

  Serial.println(F("--- Bắt đầu đọc cảm biến ---"));

  // 1. Đọc PMS7003
  if (readPMS(data)) {
    Serial.println(F("[PMS7003] Đọc thành công"));
  } else {
    Serial.println(F("[PMS7003] Lỗi đọc dữ liệu!"));
  }

  // 2. Đọc DHT22 (đọc trước để bù nhiệt cho CCS811)
  if (readDHT(data)) {
    Serial.println(F("[DHT22] Đọc thành công"));
  } else {
    Serial.println(F("[DHT22] Lỗi đọc dữ liệu!"));
  }

  // 3. Đọc CCS811 (cần warm-up 20 phút)
  if (readCCS811(data)) {
    Serial.println(F("[CCS811] Đọc thành công"));
  } else {
    Serial.println(F("[CCS811] Chưa sẵn sàng (warm-up)"));
  }

  // 4. Đọc Battery
  data.battery = readBattery();

  // 5. In dữ liệu ra Serial
  printSensorData(data);

  // 6. Gửi qua LoRa
  sendLoRaPacket(data);

  // 7. Deep Sleep hoặc delay
  if (ENABLE_DEEP_SLEEP) {
    enterDeepSleep();
  } else {
    delay(SEND_INTERVAL_MS);
  }
}

// ==================== SETUP FUNCTIONS ====================

void setupLoRa() {
  Serial.print(F("[LoRa] Đang khởi tạo... "));

  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_CS);
  LoRa.setPins(LORA_CS, LORA_RST, LORA_DIO0);

  int retries = 0;
  while (!LoRa.begin(LORA_FREQUENCY) && retries < 5) {
    Serial.print(".");
    retries++;
    delay(1000);
  }

  if (retries >= 5) {
    Serial.println(F(" THẤT BẠI!"));
    Serial.println(F("[LoRa] Không tìm thấy module SX1278!"));
    // Vẫn tiếp tục chạy nhưng không gửi được
    return;
  }

  // Cấu hình LoRa
  LoRa.setSpreadingFactor(LORA_SPREAD_FACTOR);
  LoRa.setSignalBandwidth(LORA_BANDWIDTH);
  LoRa.setTxPower(LORA_TX_POWER);
  LoRa.setSyncWord(LORA_SYNC_WORD);
  LoRa.enableCrc();

  Serial.println(F(" OK!"));
  Serial.printf("  Freq: %.0f MHz, SF: %d, BW: %.0f kHz, TxPower: %d dBm\n",
                LORA_FREQUENCY / 1E6, LORA_SPREAD_FACTOR,
                LORA_BANDWIDTH / 1E3, LORA_TX_POWER);
}

void setupPMS() {
  Serial.print(F("[PMS7003] Đang khởi tạo... "));
  pmsSerial.begin(9600, SERIAL_8N1, PMS_RX, PMS_TX);
  pms.passiveMode();  // Chế độ passive - chủ động yêu cầu đọc
  Serial.println(F("OK!"));
}

void setupCCS811() {
  Serial.print(F("[CCS811] Đang khởi tạo... "));

  if (ccs811.begin()) {
    ccs811Ready = true;
    ccs811StartTime = millis();
    Serial.println(F("OK!"));
    Serial.println(F("  Cần warm-up 20 phút để dữ liệu chính xác."));
  } else {
    ccs811Ready = false;
    Serial.println(F("THẤT BẠI! Kiểm tra kết nối I2C."));
  }
}

void setupDHT() {
  Serial.print(F("[DHT22] Đang khởi tạo... "));
  dht.begin();
  Serial.println(F("OK!"));
}

// ==================== READ FUNCTIONS ====================

bool readPMS(SensorData &data) {
  pms.wakeUp();
  delay(30000);  // PMS cần 30s ổn định sau khi wake up

  pms.requestRead();

  if (pms.readUntil(pmsData, 5000)) {  // Timeout 5s
    data.pm25 = pmsData.PM_AE_UG_2_5 * 10;  // Nhân 10 để giữ 1 số thập phân
    data.pm10 = pmsData.PM_AE_UG_10_0 * 10;
    pms.sleep();
    return true;
  }

  pms.sleep();
  return false;
}

bool readCCS811(SensorData &data) {
  if (!ccs811Ready) return false;

  // Kiểm tra thời gian warm-up
  if (millis() - ccs811StartTime < CCS811_WARMUP_MS) {
    data.co2 = 0;
    data.tvoc = 0;
    return false;
  }

  // Bù nhiệt độ và độ ẩm từ DHT22
  float temp = (float)data.temperature / 10.0;
  float hum = (float)data.humidity / 10.0;
  if (temp != 0 && hum != 0) {
    ccs811.setEnvironmentalData(hum, temp);
  }

  if (ccs811.available()) {
    if (!ccs811.readData()) {
      data.co2 = ccs811.geteCO2();    // ppm (400-8192)
      data.tvoc = ccs811.getTVOC();   // ppb (0-1187)
      return true;
    }
  }

  return false;
}

bool readDHT(SensorData &data) {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  if (isnan(temp) || isnan(hum)) {
    return false;
  }

  data.temperature = (int16_t)(temp * 10);  // Nhân 10 để giữ 1 số thập phân
  data.humidity = (uint16_t)(hum * 10);
  return true;
}

uint8_t readBattery() {
  // Đọc ADC, giả sử dùng voltage divider 2:1
  // Vmax = 4.2V (pin đầy), Vmin = 3.0V (pin cạn)
  int adcValue = analogRead(BATTERY_PIN);
  float voltage = (adcValue / 4095.0) * 3.3 * 2.0;  // ×2 vì voltage divider

  // Chuyển đổi voltage sang phần trăm
  float percent = ((voltage - 3.0) / (4.2 - 3.0)) * 100.0;
  percent = constrain(percent, 0, 100);

  return (uint8_t)percent;
}

// ==================== SEND LORA PACKET ====================

void sendLoRaPacket(const SensorData &data) {
  uint8_t packet[PACKET_SIZE];
  int idx = 0;

  // Header
  packet[idx++] = NODE_ID;
  packet[idx++] = PKT_TYPE_DATA;

  // PM2.5 (2 bytes, big-endian)
  packet[idx++] = (data.pm25 >> 8) & 0xFF;
  packet[idx++] = data.pm25 & 0xFF;

  // PM10 (2 bytes)
  packet[idx++] = (data.pm10 >> 8) & 0xFF;
  packet[idx++] = data.pm10 & 0xFF;

  // CO2 (2 bytes)
  packet[idx++] = (data.co2 >> 8) & 0xFF;
  packet[idx++] = data.co2 & 0xFF;

  // TVOC (2 bytes)
  packet[idx++] = (data.tvoc >> 8) & 0xFF;
  packet[idx++] = data.tvoc & 0xFF;

  // Temperature (2 bytes, signed)
  packet[idx++] = (data.temperature >> 8) & 0xFF;
  packet[idx++] = data.temperature & 0xFF;

  // Humidity (2 bytes)
  packet[idx++] = (data.humidity >> 8) & 0xFF;
  packet[idx++] = data.humidity & 0xFF;

  // Battery (1 byte)
  packet[idx++] = data.battery;

  // Gửi packet
  Serial.print(F("[LoRa] Đang gửi packet... "));

  LoRa.beginPacket();
  LoRa.write(packet, PACKET_SIZE);
  LoRa.endPacket();

  Serial.printf("OK! (%d bytes)\n", PACKET_SIZE);

  // In hex dump
  Serial.print(F("  HEX: "));
  for (int i = 0; i < PACKET_SIZE; i++) {
    Serial.printf("%02X ", packet[i]);
  }
  Serial.println();
}

// ==================== DEEP SLEEP ====================

void enterDeepSleep() {
  Serial.printf("[SLEEP] Ngủ %d giây...\n", SEND_INTERVAL_MS / 1000);
  Serial.flush();

  // Tắt LoRa trước khi ngủ
  LoRa.sleep();

  // Cấu hình deep sleep
  esp_sleep_enable_timer_wakeup((uint64_t)SEND_INTERVAL_MS * 1000ULL); // µs
  esp_deep_sleep_start();
}

// ==================== PRINT DATA ====================

void printSensorData(const SensorData &data) {
  Serial.println(F("┌─────────────────────────────────────┐"));
  Serial.println(F("│      DỮ LIỆU CẢM BIẾN              │"));
  Serial.println(F("├─────────────────────────────────────┤"));
  Serial.printf("│  PM2.5:    %6.1f µg/m³             │\n", data.pm25 / 10.0);
  Serial.printf("│  PM10:     %6.1f µg/m³             │\n", data.pm10 / 10.0);
  Serial.printf("│  CO2:      %5d ppm               │\n", data.co2);
  Serial.printf("│  TVOC:     %5d ppb               │\n", data.tvoc);
  Serial.printf("│  Nhiệt độ: %5.1f °C                │\n", data.temperature / 10.0);
  Serial.printf("│  Độ ẩm:    %5.1f %%                 │\n", data.humidity / 10.0);
  Serial.printf("│  Pin:      %5d %%                  │\n", data.battery);
  Serial.println(F("└─────────────────────────────────────┘"));
}
