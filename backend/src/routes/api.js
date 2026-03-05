/**
 * API Routes
 * REST API endpoints cho dashboard frontend
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../models/database');
const { calculateAQI, getAQIInfo, getCO2Info, getTVOCInfo } = require('../services/aqiService');

// ==================== NODES ====================

// GET /api/nodes - Danh sách tất cả node
router.get('/nodes', async (req, res) => {
  try {
    const [nodes] = await pool.execute(`
      SELECT n.*,
        (SELECT m.pm25 FROM measurements m WHERE m.node_id = n.id ORDER BY m.created_at DESC LIMIT 1) as latest_pm25,
        (SELECT m.pm10 FROM measurements m WHERE m.node_id = n.id ORDER BY m.created_at DESC LIMIT 1) as latest_pm10,
        (SELECT m.co2 FROM measurements m WHERE m.node_id = n.id ORDER BY m.created_at DESC LIMIT 1) as latest_co2,
        (SELECT m.tvoc FROM measurements m WHERE m.node_id = n.id ORDER BY m.created_at DESC LIMIT 1) as latest_tvoc,
        (SELECT m.temperature FROM measurements m WHERE m.node_id = n.id ORDER BY m.created_at DESC LIMIT 1) as latest_temp,
        (SELECT m.humidity FROM measurements m WHERE m.node_id = n.id ORDER BY m.created_at DESC LIMIT 1) as latest_humidity,
        (SELECT m.battery FROM measurements m WHERE m.node_id = n.id ORDER BY m.created_at DESC LIMIT 1) as latest_battery,
        (SELECT m.aqi FROM measurements m WHERE m.node_id = n.id ORDER BY m.created_at DESC LIMIT 1) as latest_aqi
      FROM nodes n
      ORDER BY n.id
    `);

    const result = nodes.map(node => ({
      ...node,
      aqi_info: node.latest_aqi ? getAQIInfo(node.latest_aqi) : null,
      co2_info: node.latest_co2 ? getCO2Info(node.latest_co2) : null,
      tvoc_info: node.latest_tvoc ? getTVOCInfo(node.latest_tvoc) : null,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/nodes/:id - Chi tiết node
router.get('/nodes/:id', async (req, res) => {
  try {
    const [nodes] = await pool.execute('SELECT * FROM nodes WHERE id = ?', [req.params.id]);
    if (nodes.length === 0) {
      return res.status(404).json({ success: false, error: 'Node không tồn tại' });
    }
    res.json({ success: true, data: nodes[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== MEASUREMENTS ====================

// GET /api/nodes/:id/data - Dữ liệu theo node
router.get('/nodes/:id/data', async (req, res) => {
  try {
    const { from, to, limit } = req.query;
    let query = 'SELECT * FROM measurements WHERE node_id = ?';
    const params = [req.params.id];

    if (from) {
      query += ' AND created_at >= ?';
      params.push(from);
    }
    if (to) {
      query += ' AND created_at <= ?';
      params.push(to);
    }

    query += ' ORDER BY created_at DESC';

    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
    } else {
      query += ' LIMIT 100';
    }

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/nodes/:id/data/latest - Dữ liệu mới nhất của node
router.get('/nodes/:id/data/latest', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM measurements WHERE node_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.json({ success: true, data: null });
    }

    const data = rows[0];
    res.json({
      success: true,
      data: {
        ...data,
        aqi_info: getAQIInfo(data.aqi),
        co2_info: getCO2Info(data.co2),
        tvoc_info: getTVOCInfo(data.tvoc),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AQI ====================

// GET /api/aqi/current - AQI hiện tại tất cả node
router.get('/aqi/current', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT n.id, n.name, n.location_name, n.latitude, n.longitude,
             m.pm25, m.pm10, m.co2, m.tvoc, m.temperature, m.humidity,
             m.battery, m.aqi, m.created_at
      FROM nodes n
      LEFT JOIN measurements m ON m.node_id = n.id
        AND m.created_at = (
          SELECT MAX(m2.created_at)
          FROM measurements m2
          WHERE m2.node_id = n.id
        )
      ORDER BY n.id
    `);

    const result = rows.map(row => ({
      ...row,
      aqi_info: row.aqi ? getAQIInfo(row.aqi) : null,
      co2_info: row.co2 ? getCO2Info(row.co2) : null,
      tvoc_info: row.tvoc ? getTVOCInfo(row.tvoc) : null,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ALERTS ====================

// GET /api/alerts - Tất cả cảnh báo
router.get('/alerts', async (req, res) => {
  try {
    const { acknowledged, limit } = req.query;
    let query = `
      SELECT a.*, n.name as node_name
      FROM alerts a
      JOIN nodes n ON n.id = a.node_id
    `;
    const params = [];

    if (acknowledged !== undefined) {
      query += ' WHERE a.acknowledged = ?';
      params.push(acknowledged === 'true' ? 1 : 0);
    }

    query += ' ORDER BY a.created_at DESC';
    query += ` LIMIT ${parseInt(limit) || 50}`;

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/alerts/:id/acknowledge - Xác nhận cảnh báo
router.put('/alerts/:id/acknowledge', async (req, res) => {
  try {
    await pool.execute(
      'UPDATE alerts SET acknowledged = TRUE WHERE id = ?',
      [req.params.id]
    );
    res.json({ success: true, message: 'Đã xác nhận cảnh báo' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== STATISTICS ====================

// GET /api/stats/summary - Thống kê tổng hợp
router.get('/stats/summary', async (req, res) => {
  try {
    const [nodeCount] = await pool.execute('SELECT COUNT(*) as count FROM nodes');
    const [onlineCount] = await pool.execute(
      "SELECT COUNT(*) as count FROM nodes WHERE status = 'online'"
    );
    const [alertCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM alerts WHERE acknowledged = FALSE'
    );
    const [totalMeasurements] = await pool.execute(
      'SELECT COUNT(*) as count FROM measurements'
    );

    // AQI trung bình 1 giờ qua
    const [avgAQI] = await pool.execute(`
      SELECT AVG(aqi) as avg_aqi
      FROM measurements
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);

    res.json({
      success: true,
      data: {
        total_nodes: nodeCount[0].count,
        online_nodes: onlineCount[0].count,
        pending_alerts: alertCount[0].count,
        total_measurements: totalMeasurements[0].count,
        avg_aqi_1h: Math.round(avgAQI[0].avg_aqi || 0),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
