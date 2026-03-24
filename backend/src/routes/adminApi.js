const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Parser } = require('json2csv');
const { pool } = require('../models/database');

const JWT_SECRET = process.env.JWT_SECRET || 'airquality-admin-secret-2026';

// ======================= MIDDLEWARE =======================
// Middleware xác thực JWT
const verifyAdmin = (req, res, next) => {
  const tokenHeader = req.headers['authorization'];
  if (!tokenHeader) {
    return res.status(401).json({ success: false, error: 'Truy cập bị từ chối. Vui lòng cung cấp token' });
  }

  const token = tokenHeader.split(' ')[1]; // "Bearer <token>"
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token không hợp lệ' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    if (verified.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Chỉ Admin mới có quyền truy cập' });
    }
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ success: false, error: 'Token đã hết hạn hoặc không hợp lệ' });
  }
};

// ======================= AUTH API =======================

// POST /api/v1/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, error: 'Nhập đầy đủ tên và mật khẩu' });

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (rows.length === 0) return res.status(401).json({ success: false, error: 'Tài khoản không tồn tại' });
    
    const user = rows[0];
    let isMatch = false;

    // init.sql có dòng insert 'admin' với password_hash = 'admin123', hỗ trợ plain text tạm thời
    if (user.password_hash === password) {
       isMatch = true;
       // (Best Practice: Có thể tự động update hash cho user ở đây trong tương lai)
    } else {
       isMatch = await bcrypt.compare(password, user.password_hash);
    }

    if (!isMatch) return res.status(401).json({ success: false, error: 'Sai mật khẩu' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({ success: true, token, user: { username: user.username, role: user.role } });
  } catch (error) {
    console.error('[Admin Login API]', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// ======================= DEVICE MANAGEMENT =======================

// GET /api/v1/admin/gateways
router.get('/gateways', verifyAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM gateways ORDER BY last_seen DESC NULLS LAST');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/admin/nodes
router.get('/nodes', verifyAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT n.*, g.name as gateway_name 
      FROM sensor_nodes n 
      LEFT JOIN gateways g ON n.gateway_id = g.id
      ORDER BY n.id ASC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ======================= EXPORT API =======================

// GET /api/v1/admin/export/measurements?node_id=NODE_001&limit=1000
router.get('/export/measurements', verifyAdmin, async (req, res) => {
  const { node_id, limit } = req.query;
  const qLimit = parseInt(limit) || 1000;
  
  try {
    let queryStr = 'SELECT time, node_id, pm25, pm10, co2, tvoc, temperature, humidity FROM measurements';
    let params = [qLimit];

    if (node_id) {
      queryStr += ' WHERE node_id = $2 ORDER BY time DESC LIMIT $1';
      params.push(node_id);
    } else {
      queryStr += ' ORDER BY time DESC LIMIT $1';
    }

    const { rows } = await pool.query(queryStr, params);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Không có dữ liệu để xuất' });
    }

    // Convert sang định dạng CSV
    const fields = ['time', 'node_id', 'pm25', 'pm10', 'co2', 'tvoc', 'temperature', 'humidity'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment(`export_measurements_${Date.now()}.csv`);
    return res.send(csv);

  } catch (error) {
    console.error('[Admin Export API]', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
