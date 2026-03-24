# Hệ Thống Giám Sát Chất Lượng Không Khí Đô Thị

Hệ thống IoT giám sát chất lượng không khí theo thời gian thực sử dụng **ESP32**, **LoRa SX1278**, cảm biến bụi mịn **PMS7003**, cảm biến khí **CCS811**, cảm biến nhiệt độ/độ ẩm **DHT22**. Dữ liệu được truyền qua LoRa đến Gateway, đẩy lên server qua MQTT và hiển thị trên giao diện web React.

## Kiến trúc hệ thống

```
[Sensor Node]              [Gateway]              [Backend]           [Frontend]
 ESP32 + LoRa    --LoRa-->  ESP32 + LoRa  --MQTT-->  Node.js   <--HTTP/WS-->  React
 PMS7003                    WiFi + MQTT       MySQL + Socket.IO      ECharts
 CCS811                                                              Leaflet
 DHT22
```

## Cấu trúc thư mục

```
datn/
├── backend/          # Backend Node.js (Express + MQTT + Socket.IO)
│   ├── src/
│   │   ├── models/   # Kết nối & truy vấn database MySQL
│   │   ├── mqtt/     # MQTT subscriber nhận dữ liệu từ gateway
│   │   ├── routes/   # REST API endpoints
│   │   ├── services/ # Business logic
│   │   └── server.js # Entry point
│   └── .env          # Biến môi trường
├── frontend/         # Frontend React (Vite)
│   └── src/
│       ├── pages/    # Dashboard, NodeDetail, Alerts
│       └── App.jsx
├── firmware/         # Firmware ESP32 (PlatformIO)
│   ├── sensor-node/  # Code cho node cảm biến
│   └── gateway/      # Code cho gateway LoRa → MQTT
├── hardware/         # Sơ đồ nguyên lý mạch
│   └── schematic/
└── docs/             # Tài liệu, báo cáo, slide
```

## Yêu cầu

### Phần mềm

| Công cụ        | Phiên bản   | Mục đích                    |
| --------------- | ----------- | --------------------------- |
| Node.js         | >= 18       | Chạy backend server         |
| MySQL           | >= 8.0      | Cơ sở dữ liệu              |
| PlatformIO CLI  | >= 6.0      | Nạp firmware ESP32          |
| Git             | >= 2.0      | Quản lý mã nguồn            |

### Phần cứng

- 2x ESP32 DevKit v1
- 2x Module LoRa SX1278 (433MHz)
- 1x Cảm biến bụi mịn PMS7003
- 1x Cảm biến khí CCS811
- 1x Cảm biến nhiệt độ/độ ẩm DHT22
- Breadboard, dây nối, nguồn 5V

## Hướng dẫn cài đặt & chạy

### 1. Clone dự án

```bash
git clone <repository-url>
cd datn
```

### 2. Cài đặt database MySQL

Tạo database và bảng:

```sql
CREATE DATABASE airquality;
```

### 3. Cấu hình Backend

```bash
cd backend
```

Chỉnh sửa file `.env` với thông tin của bạn:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=airquality

# MQTT Broker
MQTT_BROKER=mqtt://broker.hivemq.com:1883
MQTT_TOPIC=airquality/data

# Server
PORT=3000
```

Cài đặt dependencies và chạy:

```bash
npm install

# Chạy ở chế độ development (auto-reload)
npm run dev

# Hoặc chạy production
npm start
```

Backend sẽ chạy tại: `http://localhost:3000`

### 4. Cài đặt & chạy Frontend

```bash
cd frontend
npm install

# Chạy development server
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

Build cho production:

```bash
npm run build
```

Thư mục `dist/` sẽ được tạo và backend tự động serve các file tĩnh này.

### 5. Nạp firmware cho ESP32

Cần cài đặt [PlatformIO](https://platformio.org/) (extension VS Code hoặc CLI).

#### Sensor Node

```bash
cd firmware/sensor-node
pio run --target upload --upload-port <COM_PORT>
pio device monitor --port <COM_PORT> --baud 115200
```

#### Gateway

```bash
cd firmware/gateway
pio run --target upload --upload-port <COM_PORT>
pio device monitor --port <COM_PORT> --baud 115200
```

> Thay `<COM_PORT>` bằng cổng COM thực tế của ESP32 (ví dụ: `COM3` trên Windows).

## API Endpoints

| Method | Endpoint            | Mô tả                          |
| ------ | ------------------- | ------------------------------- |
| GET    | `/api/...`          | Lấy dữ liệu cảm biến          |
| GET    | `/health`           | Kiểm tra trạng thái server     |

## Giao thức truyền dữ liệu

```
Sensor Node  --(LoRa 433MHz)-->  Gateway  --(WiFi/MQTT)-->  Backend
                                                                |
                                                          Socket.IO (realtime)
                                                                |
                                                            Frontend
```

- **LoRa**: Truyền dữ liệu từ node cảm biến đến gateway (khoảng cách xa, tiết kiệm năng lượng)
- **MQTT**: Gateway publish dữ liệu lên broker, backend subscribe nhận dữ liệu
- **Socket.IO**: Đẩy dữ liệu realtime từ backend đến frontend
- **REST API**: Frontend truy vấn dữ liệu lịch sử

## Công nghệ sử dụng

| Thành phần | Công nghệ                                   |
| ---------- | -------------------------------------------- |
| Frontend   | React, Vite, ECharts, Leaflet, Socket.IO     |
| Backend    | Node.js, Express, MQTT.js, Socket.IO, MySQL2 |
| Database   | MySQL                                        |
| Firmware   | Arduino (PlatformIO), LoRa, PubSubClient     |
| MQTT Broker| HiveMQ (public broker)                       |
