# Đồ án: Hệ thống giám sát chất lượng không khí đô thị

## Phase 1: Project Setup
- [x] Tạo cấu trúc thư mục dự án
- [x] Firmware Sensor Node (ESP32 + LoRa + PMS7003 + CCS811 + DHT22)
- [x] Firmware Gateway (ESP32 + LoRa + WiFi + MQTT)

## Phase 2: Backend
- [x] Setup Node.js + Express server
- [x] MQTT subscriber
- [x] Database schema (MySQL)
- [x] REST API endpoints
- [x] AQI/CO₂/TVOC calculation & alerts

## Phase 3: Frontend Dashboard
- [x] React + Vite setup
- [x] Dashboard page (bản đồ + biểu đồ)
- [x] Node detail page
- [x] Alerts page
- [ ] Kết nối API thực (thay demo data bằng axios calls)

## Phase 4: Verification
- [x] Test frontend renders (3 pages verified)
- [ ] Test firmware truyền nhận LoRa (cần phần cứng)
- [ ] Test API endpoints (cần MySQL)
- [x] Walkthrough
