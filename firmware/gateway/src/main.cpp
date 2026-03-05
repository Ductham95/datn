/*
 * =====================================================
 * HỆ THỐNG GIÁM SÁT CHẤT LƯỢNG KHÔNG KHÍ ĐÔ THỊ
 * Firmware: LoRa Gateway
 * MCU: ESP32 DevKit V1
 * Communication: LoRa SX1278 → WiFi → MQTT Broker
 * =====================================================
 */

#include <Arduino.h>
#include <SPI.h>
#include <LoRa.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ==================== CẤU HÌNH WIFI ====================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";      // << Thay đổi
const char* WIFI_PASSWORD  = "YOUR_WIFI_PASSWORD";  // << Thay đổi

// ==================== CẤU HÌNH MQTT ====================
const char* MQTT_SERVER   = "broker.hivemq.com";  // MQTT broker (hoặc IP local)
const int   MQTT_PORT     = 1883;
const char* MQTT_USER     = "";                    // Để trống nếu không cần auth
const char* MQTT_PASSWORD = "";
const char* MQTT_TOPIC    = "airquality/data";     // Topic gửi dữ liệu
const char* MQTT_CLIENT   = "AirQuality_Gateway";

// ==================== PIN DEFINITIONS (LoRa SX1278) ====================
#define LORA_SCK    18
#define LORA_MISO   19
#define LORA_MOSI   23
#define LORA_CS     5
#define LORA_RST    14
#define LORA_DIO0   2

// ==================== LoRa CONFIGURATION ====================
// Phải khớp với Sensor Node!
#define LORA_FREQUENCY     433E6
#define LORA_BANDWIDTH     125E3
#define LORA_SPREAD_FACTOR 7
#define LORA_SYNC_WORD     0x12

// ==================== PACKET STRUCTURE ====================
#define PKT_TYPE_DATA      0x01
#define PACKET_SIZE        15

// ==================== ĐỐI TƯỢNG ====================
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// ==================== BIẾN TOÀN CỤC ====================
unsigned long lastReconnectAttempt = 0;
unsigned long packetsReceived = 0;
unsigned long packetsSent = 0;

// Buffer cho khi mất kết nối MQTT
#define BUFFER_SIZE 20
struct BufferedPacket {
  String json;
  bool used;
};
BufferedPacket packetBuffer[BUFFER_SIZE];
int bufferHead = 0;

// ==================== FUNCTION DECLARATIONS ====================
void setupWiFi();
void setupLoRa();
void setupMQTT();
void reconnectMQTT();
void onLoRaReceive(int packetSize);
void parseAndPublish(uint8_t* data, int length, int rssi, float snr);
void bufferPacket(const String &json);
void flushBuffer();
void printStatus();

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println(F("========================================"));
  Serial.println(F("  AIR QUALITY MONITORING - GATEWAY"));
  Serial.println(F("========================================"));

  // Khởi tạo buffer
  for (int i = 0; i < BUFFER_SIZE; i++) {
    packetBuffer[i].used = false;
  }

  setupWiFi();
  setupLoRa();
  setupMQTT();

  Serial.println(F("[OK] Gateway đã sẵn sàng nhận dữ liệu!"));
  Serial.println();
}

// ==================== LOOP ====================
void loop() {
  // 1. Kiểm tra và duy trì kết nối WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[WiFi] Mất kết nối, đang kết nối lại..."));
    setupWiFi();
  }

  // 2. Kiểm tra và duy trì kết nối MQTT
  if (!mqttClient.connected()) {
    unsigned long now = millis();
    if (now - lastReconnectAttempt > 5000) {
      lastReconnectAttempt = now;
      reconnectMQTT();
    }
  } else {
    mqttClient.loop();
    // Gửi các packet đã buffer khi có kết nối
    flushBuffer();
  }

  // 3. Kiểm tra gói tin LoRa
  int packetSize = LoRa.parsePacket();
  if (packetSize > 0) {
    onLoRaReceive(packetSize);
  }

  // 4. In trạng thái mỗi 30 giây
  static unsigned long lastStatus = 0;
  if (millis() - lastStatus > 30000) {
    lastStatus = millis();
    printStatus();
  }
}

// ==================== SETUP FUNCTIONS ====================

void setupWiFi() {
  Serial.printf("[WiFi] Đang kết nối đến %s", WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 30) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F(" OK!"));
    Serial.printf("  IP: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("  RSSI: %d dBm\n", WiFi.RSSI());
  } else {
    Serial.println(F(" THẤT BẠI!"));
    Serial.println(F("  Sẽ thử lại sau. Dữ liệu sẽ được buffer."));
  }
}

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
    while (true) {
      delay(1000);  // Dừng lại vì gateway không hoạt động được nếu không có LoRa
    }
  }

  // Cấu hình phải khớp với Sensor Node
  LoRa.setSpreadingFactor(LORA_SPREAD_FACTOR);
  LoRa.setSignalBandwidth(LORA_BANDWIDTH);
  LoRa.setSyncWord(LORA_SYNC_WORD);
  LoRa.enableCrc();

  Serial.println(F(" OK!"));
  Serial.printf("  Freq: %.0f MHz, SF: %d, Listening...\n",
                LORA_FREQUENCY / 1E6, LORA_SPREAD_FACTOR);
}

void setupMQTT() {
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setBufferSize(512);
  reconnectMQTT();
}

void reconnectMQTT() {
  Serial.print(F("[MQTT] Đang kết nối... "));

  if (mqttClient.connect(MQTT_CLIENT, MQTT_USER, MQTT_PASSWORD)) {
    Serial.println(F("OK!"));
    Serial.printf("  Broker: %s:%d\n", MQTT_SERVER, MQTT_PORT);
    Serial.printf("  Topic: %s\n", MQTT_TOPIC);
  } else {
    Serial.printf("THẤT BẠI! (rc=%d)\n", mqttClient.state());
  }
}

// ==================== LORA RECEIVE ====================

void onLoRaReceive(int packetSize) {
  if (packetSize < PACKET_SIZE) {
    Serial.printf("[LoRa] Gói tin quá ngắn (%d bytes), bỏ qua.\n", packetSize);
    return;
  }

  uint8_t buffer[PACKET_SIZE];
  for (int i = 0; i < PACKET_SIZE && i < packetSize; i++) {
    buffer[i] = LoRa.read();
  }

  int rssi = LoRa.packetRssi();
  float snr = LoRa.packetSnr();

  packetsReceived++;
  Serial.printf("\n[LoRa] Nhận gói tin #%lu từ Node 0x%02X (RSSI: %d dBm, SNR: %.1f dB)\n",
                packetsReceived, buffer[0], rssi, snr);

  parseAndPublish(buffer, PACKET_SIZE, rssi, snr);
}

// ==================== PARSE & PUBLISH ====================

void parseAndPublish(uint8_t* data, int length, int rssi, float snr) {
  // Parse packet
  int idx = 0;
  uint8_t nodeId   = data[idx++];
  uint8_t pktType  = data[idx++];

  if (pktType != PKT_TYPE_DATA) {
    Serial.printf("[Parse] Loại packet không xác định: 0x%02X\n", pktType);
    return;
  }

  uint16_t pm25    = (data[idx] << 8) | data[idx + 1]; idx += 2;
  uint16_t pm10    = (data[idx] << 8) | data[idx + 1]; idx += 2;
  uint16_t co2     = (data[idx] << 8) | data[idx + 1]; idx += 2;
  uint16_t tvoc    = (data[idx] << 8) | data[idx + 1]; idx += 2;
  int16_t  temp    = (data[idx] << 8) | data[idx + 1]; idx += 2;
  uint16_t hum     = (data[idx] << 8) | data[idx + 1]; idx += 2;
  uint8_t  battery = data[idx++];

  // In dữ liệu đã parse
  Serial.println(F("  ┌─── Dữ liệu Node ───────────────┐"));
  Serial.printf("  │ PM2.5:  %6.1f µg/m³             │\n", pm25 / 10.0);
  Serial.printf("  │ PM10:   %6.1f µg/m³             │\n", pm10 / 10.0);
  Serial.printf("  │ CO2:    %5d ppm               │\n", co2);
  Serial.printf("  │ TVOC:   %5d ppb               │\n", tvoc);
  Serial.printf("  │ Temp:   %5.1f °C                │\n", temp / 10.0);
  Serial.printf("  │ Hum:    %5.1f %%                 │\n", hum / 10.0);
  Serial.printf("  │ Battery:%4d %%                  │\n", battery);
  Serial.println(F("  └───────────────────────────────────┘"));

  // Tạo JSON payload
  JsonDocument doc;
  doc["node_id"]      = nodeId;
  doc["pm25"]         = pm25 / 10.0;
  doc["pm10"]         = pm10 / 10.0;
  doc["co2"]          = co2;
  doc["tvoc"]         = tvoc;
  doc["temperature"]  = temp / 10.0;
  doc["humidity"]     = hum / 10.0;
  doc["battery"]      = battery;
  doc["rssi"]         = rssi;
  doc["snr"]          = snr;
  doc["timestamp"]    = millis();

  String jsonStr;
  serializeJson(doc, jsonStr);

  // Gửi qua MQTT
  if (mqttClient.connected()) {
    // Gửi lên topic chung
    if (mqttClient.publish(MQTT_TOPIC, jsonStr.c_str())) {
      packetsSent++;
      Serial.printf("[MQTT] Đã gửi lên topic: %s\n", MQTT_TOPIC);
    } else {
      Serial.println(F("[MQTT] Lỗi gửi! Buffer packet."));
      bufferPacket(jsonStr);
    }

    // Gửi lên topic riêng của node
    char nodeTopic[50];
    snprintf(nodeTopic, sizeof(nodeTopic), "airquality/node/%d", nodeId);
    mqttClient.publish(nodeTopic, jsonStr.c_str());
  } else {
    Serial.println(F("[MQTT] Chưa kết nối. Buffer packet."));
    bufferPacket(jsonStr);
  }
}

// ==================== BUFFER MANAGEMENT ====================

void bufferPacket(const String &json) {
  packetBuffer[bufferHead].json = json;
  packetBuffer[bufferHead].used = true;
  bufferHead = (bufferHead + 1) % BUFFER_SIZE;
  Serial.printf("[Buffer] Đã lưu packet (slot %d)\n", bufferHead);
}

void flushBuffer() {
  for (int i = 0; i < BUFFER_SIZE; i++) {
    if (packetBuffer[i].used) {
      if (mqttClient.publish(MQTT_TOPIC, packetBuffer[i].json.c_str())) {
        packetBuffer[i].used = false;
        packetsSent++;
        Serial.printf("[Buffer] Đã gửi packet từ slot %d\n", i);
      } else {
        break;  // MQTT bị lỗi, dừng flush
      }
    }
  }
}

// ==================== STATUS ====================

void printStatus() {
  Serial.println(F("\n--- GATEWAY STATUS ---"));
  Serial.printf("  WiFi: %s (RSSI: %d dBm)\n",
                WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected",
                WiFi.RSSI());
  Serial.printf("  MQTT: %s\n",
                mqttClient.connected() ? "Connected" : "Disconnected");
  Serial.printf("  Packets received: %lu\n", packetsReceived);
  Serial.printf("  Packets sent: %lu\n", packetsSent);

  // Đếm buffer
  int buffered = 0;
  for (int i = 0; i < BUFFER_SIZE; i++) {
    if (packetBuffer[i].used) buffered++;
  }
  Serial.printf("  Buffered packets: %d/%d\n", buffered, BUFFER_SIZE);
  Serial.println(F("----------------------\n"));
}
