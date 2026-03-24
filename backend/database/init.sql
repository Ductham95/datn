-- Kích hoạt các tính năng/extensions
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tạo bảng Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng Gateways
CREATE TABLE gateways (
    id VARCHAR(50) PRIMARY KEY, -- Mac Address
    name VARCHAR(100) NOT NULL,
    location_desc VARCHAR(255),
    status VARCHAR(20) DEFAULT 'offline',
    last_seen TIMESTAMPTZ
);

-- Tạo bảng Sensor Nodes có sử dụng PostGIS (Cột geom)
CREATE TABLE sensor_nodes (
    id VARCHAR(50) PRIMARY KEY,
    gateway_id VARCHAR(50) REFERENCES gateways(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    geom GEOMETRY(Point, 4326),
    status VARCHAR(20) DEFAULT 'active',
    battery_level INT DEFAULT 100,
    lora_rssi INT
);

-- Tạo bảng Measurements
CREATE TABLE measurements (
    time TIMESTAMPTZ NOT NULL,
    node_id VARCHAR(50) REFERENCES sensor_nodes(id) ON DELETE CASCADE,
    pm25 DOUBLE PRECISION,
    pm10 DOUBLE PRECISION,
    co2 INT,
    tvoc INT,
    temperature DOUBLE PRECISION,
    humidity DOUBLE PRECISION,
    UNIQUE (time, node_id)
);

-- Tạo Hypertable cho measurements trong TimescaleDB
SELECT create_hypertable('measurements', 'time', if_not_exists => TRUE);

-- Thiết lập Retention Policy để xóa dữ liệu quá 3 tháng cho bảng measurements thô
SELECT add_retention_policy('measurements', INTERVAL '3 months');

-- Tạo Continuous Aggregate View cho lịch sử từng giờ
CREATE MATERIALIZED VIEW hourly_measurements
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', time) AS bucket_time,
       node_id,
       AVG(pm25) AS avg_pm25,
       AVG(pm10) AS avg_pm10,
       AVG(co2) AS avg_co2,
       MAX(temperature) AS max_temp
FROM measurements
GROUP BY bucket_time, node_id;

-- Gắn data test cơ bản
INSERT INTO users (username, password_hash, role) VALUES ('admin', 'admin123', 'admin');

-- Insert Gateways test
INSERT INTO gateways (id, name, location_desc, status) 
VALUES ('GW_001', 'Gateway Đại học Bách Khoa', 'Sân H1', 'online');

-- Insert Sensor Nodes test
INSERT INTO sensor_nodes (id, gateway_id, name, geom, status, battery_level, lora_rssi) 
VALUES ('NODE_001', 'GW_001', 'Node 1 - Thư viện', ST_SetSRID(ST_MakePoint(106.6575, 10.7733), 4326), 'active', 95, -50),
       ('NODE_002', 'GW_001', 'Node 2 - Sân vận động', ST_SetSRID(ST_MakePoint(106.6580, 10.7740), 4326), 'active', 80, -65);
