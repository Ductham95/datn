# 🌍 Air Quality Monitoring System — Walkthrough

## Tổng quan

Đã hoàn thành xây dựng hệ thống giám sát chất lượng không khí đô thị với 4 module:

| Module | Công nghệ | Trạng thái |
|---|---|---|
| **Firmware Sensor Node** | ESP32 + LoRa + PMS7003 + CCS811 + DHT22 | ✅ Hoàn thành |
| **Firmware Gateway** | ESP32 + LoRa + WiFi + MQTT | ✅ Hoàn thành |
| **Backend Server** | Node.js + Express + MQTT + MySQL + Socket.io | ✅ Hoàn thành |
| **Frontend Dashboard** | React + Vite + ECharts + Leaflet | ✅ Hoàn thành |

---

## Screenshots

### Dashboard chính
Hiển thị tổng quan AQI, bản đồ node, biểu đồ gauge, và biểu đồ PM/CO₂ 24h.

![Dashboard chính](C:/Users/ADMIN/.gemini/antigravity/brain/f1b3001b-9125-49d3-9bab-df2515cf8e69/dashboard_screenshot.png)

### Trang chi tiết Node
Hiển thị 6 thông số, biểu đồ lịch sử, AQI gauge, thông tin pin/RSSI/SNR.

![Chi tiết Node 02](C:/Users/ADMIN/.gemini/antigravity/brain/f1b3001b-9125-49d3-9bab-df2515cf8e69/nodedetail_screenshot.png)

### Demo recording

![Dashboard demo](C:/Users/ADMIN/.gemini/antigravity/brain/f1b3001b-9125-49d3-9bab-df2515cf8e69/dashboard_verification_1772696420760.webp)

---

## Cấu trúc file đã tạo

```
datn/
├── firmware/
│   ├── sensor-node/
│   │   ├── platformio.ini          # PlatformIO config
│   │   └── src/main.cpp            # Firmware đọc cảm biến + gửi LoRa
│   └── gateway/
│       ├── platformio.ini
│       └── src/main.cpp            # Firmware nhận LoRa + gửi MQTT
├── backend/
│   ├── package.json
│   ├── .env                        # Cấu hình DB/MQTT
│   └── src/
│       ├── server.js               # Entry point
│       ├── models/database.js      # MySQL schema + init
│       ├── services/aqiService.js  # AQI/CO2/TVOC calculation
│       ├── mqtt/subscriber.js      # MQTT → DB + Socket.io
│       └── routes/api.js           # REST API endpoints
└── frontend/
    └── src/
        ├── index.css               # Design system
        ├── App.jsx                 # Router + Sidebar
        ├── App.css
        └── pages/
            ├── Dashboard.jsx       # Map + Gauges + Charts
            ├── NodeDetail.jsx      # Per-node detail
            └── Alerts.jsx          # Alert management
```

## Bước tiếp theo

1. **Lắp phần cứng**: Nối ESP32 + LoRa + PMS7003 + CCS811 + DHT22 theo sơ đồ
2. **Flash firmware**: Upload code lên ESP32 bằng PlatformIO
3. **Cài database**: Chạy `npm install` + cấu hình MySQL trong `.env`
4. **Chạy backend**: `npm run dev` trong thư mục `backend/`
5. **Kết nối API thực**: Thay demo data trong frontend bằng `axios` gọi API
