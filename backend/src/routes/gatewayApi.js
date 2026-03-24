const express = require('express');
const router = express.Router();
const { pool } = require('../models/database');

// Secret Key sử dụng cho Gateway để xác thực
const GATEWAY_SECRET = process.env.GATEWAY_SECRET || 'super-secret-key';

/**
 * POST /api/v1/telemetry
 * Endpoint nhận dữ liệu từ LoRa Gateway
 * Payload mẫu:
 * {
 *   "gateway_id": "GW_001",
 *   "secret": "super-secret-key",
 *   "data": [
 *     {
 *       "node_id": "NODE_001",
 *       "pm25": 12.5,
 *       "pm10": 15.0,
 *       "co2": 450,
 *       "tvoc": 10,
 *       "temperature": 29.5,
 *       "humidity": 60,
 *       "battery": 95,
 *       "rssi": -55
 *     }
 *   ]
 * }
 */
router.post('/', async (req, res) => {
  const { gateway_id, secret, data } = req.body;

  // 1. Xác thực Gateway
  if (!gateway_id || secret !== GATEWAY_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized or missing gateway_id' });
  }

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ success: false, error: 'Empty payload data' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 2. Cập nhật trạng thái Gateway (last_seen, online)
    await client.query(
      `UPDATE gateways SET status = 'online', last_seen = NOW() WHERE id = $1`,
      [gateway_id]
    );

    // 3. Xử lý từng gói metric của các Sensor Node
    for (const item of data) {
      if (!item.node_id) continue;

      // Cập nhật thông tin pin và sóng của Node
      await client.query(
        `UPDATE sensor_nodes SET battery_level = $1, lora_rssi = $2, status = 'active' WHERE id = $3 AND gateway_id = $4`,
        [item.battery || 100, item.rssi || '-50', item.node_id, gateway_id]
      );

      // Lưu trữ dữ liệu đo lường vào TimescaleDB (bảng measurements)
      await client.query(
        `INSERT INTO measurements (time, node_id, pm25, pm10, co2, tvoc, temperature, humidity) 
         VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7)`,
        [
          item.node_id,
          item.pm25 || 0,
          item.pm10 || 0,
          item.co2 || 400,
          item.tvoc || 0,
          item.temperature || 0,
          item.humidity || 0
        ]
      );
    }

    await client.query('COMMIT');

    // 4. Emit sự kiện Socket.io cho Frontend Dashboard
    if (req.io) {
      const { calculateAQI } = require('../services/aqiService');
      const enrichedData = data.map(item => ({
        ...item,
        aqi: calculateAQI(item.pm25 || 0, item.pm10 || 0),
        time: new Date()
      }));
      req.io.emit('new_telemetry_data', { gateway_id, data: enrichedData });
    }

    res.status(200).json({ success: true, message: 'Telemetry data ingested successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Ingestion API] Lỗi lưu dữ liệu:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  } finally {
    client.release();
  }
});

module.exports = router;
