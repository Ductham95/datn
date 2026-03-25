const { pool } = require('../config/db.config');

const processTelemetry = async (gateway_id, data) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Cập nhật trạng thái Gateway
    await client.query(
      `UPDATE gateways SET status = 'online', last_seen = NOW() WHERE id = $1`,
      [gateway_id]
    );

    // 2. Xử lý từng gói metric của các Sensor Node
    for (const item of data) {
      if (!item.node_id) continue;

      // Cập nhật thông tin pin và sóng của Node
      await client.query(
        `UPDATE sensor_nodes SET battery_level = $1, lora_rssi = $2, status = 'active' WHERE id = $3 AND gateway_id = $4`,
        [item.battery || 100, item.rssi || '-50', item.node_id, gateway_id]
      );

      // Lưu trữ dữ liệu đo lường
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
    return true;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { processTelemetry };
