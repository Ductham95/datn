/**
 * MQTT Subscriber
 * Nhận dữ liệu từ Gateway qua MQTT và lưu vào database
 */

const mqtt = require('mqtt');
const { pool } = require('../models/database');
const { calculateAQI } = require('../services/aqiService');

let io = null; // Socket.io instance

function initMQTT(socketIO) {
  io = socketIO;

  const brokerUrl = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com:1883';
  const topic = process.env.MQTT_TOPIC || 'airquality/data';

  console.log(`[MQTT] Đang kết nối đến ${brokerUrl}...`);

  const client = mqtt.connect(brokerUrl, {
    clientId: `airquality_server_${Date.now()}`,
    clean: true,
    reconnectPeriod: 5000,
  });

  client.on('connect', () => {
    console.log(`[MQTT] Đã kết nối! Subscribing topic: ${topic}`);
    client.subscribe(topic, (err) => {
      if (err) {
        console.error('[MQTT] Lỗi subscribe:', err.message);
      } else {
        console.log(`[MQTT] Đã subscribe topic: ${topic}`);
      }
    });

    // Subscribe topic riêng của mỗi node
    client.subscribe('airquality/node/+', (err) => {
      if (!err) console.log('[MQTT] Đã subscribe: airquality/node/+');
    });
  });

  client.on('message', async (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`[MQTT] Nhận dữ liệu từ Node ${data.node_id}:`, data);

      // Tính AQI
      const aqi = calculateAQI(data.pm25, data.pm10);

      // Lưu vào database
      await saveToDatabase(data, aqi);

      // Cập nhật trạng thái node
      await updateNodeStatus(data.node_id);

      // Kiểm tra cảnh báo
      await checkAlerts(data, aqi);

      // Gửi real-time qua Socket.io
      if (io) {
        io.emit('newData', {
          ...data,
          aqi,
          created_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('[MQTT] Lỗi xử lý message:', error.message);
    }
  });

  client.on('error', (err) => {
    console.error('[MQTT] Lỗi:', err.message);
  });

  client.on('reconnect', () => {
    console.log('[MQTT] Đang kết nối lại...');
  });

  return client;
}

async function saveToDatabase(data, aqi) {
  try {
    await pool.execute(
      `INSERT INTO measurements (node_id, pm25, pm10, co2, tvoc, temperature, humidity, battery, rssi, snr, aqi)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.node_id,
        data.pm25,
        data.pm10,
        data.co2 || 0,
        data.tvoc || 0,
        data.temperature,
        data.humidity,
        data.battery,
        data.rssi || 0,
        data.snr || 0,
        aqi,
      ]
    );
    console.log(`[DB] Đã lưu dữ liệu Node ${data.node_id}`);
  } catch (error) {
    console.error('[DB] Lỗi lưu dữ liệu:', error.message);
  }
}

async function updateNodeStatus(nodeId) {
  try {
    await pool.execute(
      `UPDATE nodes SET status = 'online', last_seen = NOW() WHERE id = ?`,
      [nodeId]
    );
  } catch (error) {
    console.error('[DB] Lỗi update node status:', error.message);
  }
}

async function checkAlerts(data, aqi) {
  const alerts = [];

  // Cảnh báo AQI
  if (aqi > 150) {
    alerts.push({
      type: 'aqi',
      level: aqi > 200 ? 'critical' : 'danger',
      message: `AQI = ${aqi} (${aqi > 200 ? 'Rất không tốt' : 'Không tốt'})`,
      value: aqi,
      threshold: 150,
    });
  }

  // Cảnh báo CO2
  if (data.co2 > 1500) {
    alerts.push({
      type: 'co2',
      level: data.co2 > 2000 ? 'critical' : 'warning',
      message: `CO₂ = ${data.co2} ppm (${data.co2 > 2000 ? 'Nguy hiểm' : 'Xấu'})`,
      value: data.co2,
      threshold: 1500,
    });
  }

  // Cảnh báo TVOC
  if (data.tvoc > 660) {
    alerts.push({
      type: 'tvoc',
      level: data.tvoc > 2200 ? 'critical' : 'warning',
      message: `TVOC = ${data.tvoc} ppb (Xấu)`,
      value: data.tvoc,
      threshold: 660,
    });
  }

  // Cảnh báo pin yếu
  if (data.battery < 20) {
    alerts.push({
      type: 'battery',
      level: data.battery < 10 ? 'danger' : 'warning',
      message: `Pin yếu: ${data.battery}%`,
      value: data.battery,
      threshold: 20,
    });
  }

  // Lưu các alert
  for (const alert of alerts) {
    try {
      await pool.execute(
        `INSERT INTO alerts (node_id, alert_type, level, message, value, threshold)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.node_id, alert.type, alert.level, alert.message, alert.value, alert.threshold]
      );

      // Emit alert qua socket
      if (io) {
        io.emit('alert', {
          node_id: data.node_id,
          ...alert,
          created_at: new Date().toISOString(),
        });
      }

      console.log(`[ALERT] Node ${data.node_id}: ${alert.message}`);
    } catch (error) {
      console.error('[ALERT] Lỗi lưu alert:', error.message);
    }
  }
}

module.exports = { initMQTT };
