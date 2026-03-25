const express = require('express');
const router = express.Router();

// Middlewares
const { verifyAdmin } = require('../middlewares/authMiddleware');

// Controllers
const { login } = require('../controllers/authController');
const { getGateways, getNodes } = require('../controllers/adminDeviceController');
const { exportMeasurements } = require('../controllers/exportController');

// Xử lý xác thực
router.post('/login', login);

// Admin Device Management
router.get('/gateways', verifyAdmin, getGateways);
router.get('/nodes', verifyAdmin, getNodes);

// Thống kê & Trích xuất
router.get('/export/measurements', verifyAdmin, exportMeasurements);

module.exports = router;
