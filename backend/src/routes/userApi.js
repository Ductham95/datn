const express = require('express');
const router = express.Router();
const { pool } = require('../models/database');
const { calculateAQI, getAQIInfo, getCO2Info, getTVOCInfo } = require('../services/aqiService');

/**
 * 1. Mạch lấy dữ liệu Map & List tổng quan AQI
 * GET /api/v1/stations/dashboard
 */
router.get('/stations/dashboard', async (req, res) => {
  try {
    // Truy vấn kết hợp lấy node hiện tại và measurement mới nhất của từng node
    const result = await pool.query(`
      SELECT 
        n.id as node_id, 
        n.name, 
        n.status, 
        n.battery_level, 
        ST_Y(n.geom::geometry) as lat, 
        ST_X(n.geom::geometry) as lng,
        m.time, 
        m.pm25, m.pm10, m.co2, m.tvoc, m.temperature, m.humidity
      FROM sensor_nodes n
      LEFT JOIN LATERAL (
        SELECT * FROM measurements
        WHERE node_id = n.id
        ORDER BY time DESC
        LIMIT 1
      ) m ON true
      WHERE n.status = 'active'
    `);

    const data = result.rows.map(row => {
      // Tính toán AQI động
      const aqi = calculateAQI(row.pm25 || 0, row.pm10 || 0);
      return {
        ...row,
        aqi,
        aqi_info: getAQIInfo(aqi),
        co2_info: getCO2Info(row.co2 || 400),
        tvoc_info: getTVOCInfo(row.tvoc || 0)
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('[Dashboard API] Lỗi:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * 2. Lấy dữ liệu trạm gần nhất với GPS của user (PostGIS)
 * GET /api/v1/stations/nearest?lat=10.77&lng=106.65
 */
router.get('/stations/nearest', async (req, res) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ success: false, error: 'Vui lòng cung cấp tọa độ lat và lng' });
  }

  try {
    // Sử dụng sức mạnh của PostGIS - Hàm ST_DistanceSphere (tính bằng mét)
    const result = await pool.query(`
      SELECT 
        n.id as node_id, 
        n.name,
        ST_DistanceSphere(n.geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)) AS distance_meters,
        ST_Y(n.geom::geometry) as lat, 
        ST_X(n.geom::geometry) as lng,
        m.pm25, m.pm10, m.temperature, m.humidity
      FROM sensor_nodes n
      LEFT JOIN LATERAL (
        SELECT pm25, pm10, temperature, humidity FROM measurements
        WHERE node_id = n.id ORDER BY time DESC LIMIT 1
      ) m ON true
      WHERE n.status = 'active'
      ORDER BY n.geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
      LIMIT 1;
    `, [lng, lat]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy trạm nào' });
    }

    const nearestNode = result.rows[0];
    const aqi = calculateAQI(nearestNode.pm25 || 0, nearestNode.pm10 || 0);
    
    res.json({
      success: true, 
      data: {
        ...nearestNode,
        aqi,
        aqi_info: getAQIInfo(aqi)
      }
    });

  } catch (error) {
    console.error('[Nearest Node API] Lỗi:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * 3. Lịch sử của một trạm (dùng để vẽ Line Chart)
 * GET /api/v1/stations/:id/history?type=hourly&limit=24
 */
router.get('/stations/:id/history', async (req, res) => {
  const { id } = req.params;
  const { type, limit } = req.query; // type = 'raw' hoặc 'hourly'
  const recordLimit = parseInt(limit) || 24;

  try {
    let queryStr = '';
    let params = [id, recordLimit];

    if (type === 'hourly') {
      // Query bảng Materialized view hourly_measurements
      queryStr = `
        SELECT bucket_time as time, 
               avg_pm25 as pm25, avg_pm10 as pm10, 
               avg_co2 as co2, max_temp as temperature
        FROM hourly_measurements
        WHERE node_id = $1
        ORDER BY bucket_time DESC
        LIMIT $2
      `;
    } else {
      // Query bảng dữ liệu thô
      queryStr = `
        SELECT time, pm25, pm10, co2, tvoc, temperature, humidity
        FROM measurements
        WHERE node_id = $1
        ORDER BY time DESC
        LIMIT $2
      `;
    }

    const { rows } = await pool.query(queryStr, params);
    
    // Đảo ngược mảng để trả về thời gian cũ -> mới (thuận biểu đồ vẽ từ trái qua phải)
    const chartData = rows.map(r => ({
      ...r,
      aqi: calculateAQI(r.pm25 || 0, r.pm10 || 0)
    })).reverse();

    res.json({ success: true, data: chartData });
  } catch (error) {
    console.error('[History API] Lỗi:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * 4. Tích hợp Thời tiết (Proxy)
 * GET /api/v1/weather?lat=10.77&lng=106.65
 */
router.get('/weather', async (req, res) => {
  const { lat, lng } = req.query;
  const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

  if (!WEATHER_API_KEY) {
    return res.status(500).json({ success: false, error: 'Chưa cấu hình API Key thời tiết server-side' });
  }

  if (!lat || !lng) {
    return res.status(400).json({ success: false, error: 'Thiếu lat / lng' });
  }

  try {
    const fetch = (await import('node-fetch')).default;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric&lang=vi`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: data.message });
    }

    res.json({
      success: true,
      data: {
        temp: data.main.temp,
        humidity: data.main.humidity,
        wind_speed: data.wind.speed,
        description: data.weather[0].description,
        icon: data.weather[0].icon
      }
    });
  } catch (error) {
    console.error('[Weather Proxy] Lỗi:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
