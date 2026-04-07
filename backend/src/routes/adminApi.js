const express = require('express');
const router = express.Router();

// Middlewares
const { verifyAdmin } = require('../middlewares/authMiddleware');
const { validateGatewayBody, validateNodeBody } = require('../validations/adminValidation');
const { validateConfigBody } = require('../validations/configValidation');

// Controllers
const { login } = require('../controllers/authController');
const {
  getGateways, createGateway, updateGateway, deleteGateway,
  getNodes, createNode, updateNode, deleteNode,
} = require('../controllers/adminDeviceController');
const { exportMeasurements } = require('../controllers/exportController');
const { getConfig, updateConfig } = require('../controllers/alertConfigController');
const { getAlerts, acknowledgeAlert, deleteAlert } = require('../controllers/alertController');

// ==================== Xác thực ====================
router.post('/login', login);

// ==================== Gateway CRUD ====================
router.get('/gateways',        verifyAdmin, getGateways);
router.post('/gateways',       verifyAdmin, validateGatewayBody, createGateway);
router.put('/gateways/:id',    verifyAdmin, validateGatewayBody, updateGateway);
router.delete('/gateways/:id', verifyAdmin, deleteGateway);

// ==================== Sensor Node CRUD ====================
router.get('/nodes',           verifyAdmin, getNodes);
router.post('/nodes',          verifyAdmin, validateNodeBody, createNode);
router.put('/nodes/:id',       verifyAdmin, validateNodeBody, updateNode);
router.delete('/nodes/:id',    verifyAdmin, deleteNode);

// ==================== Cấu hình ngưỡng cảnh báo ====================
router.get('/config',          verifyAdmin, getConfig);
router.put('/config',          verifyAdmin, validateConfigBody, updateConfig);

// ==================== Cảnh báo ====================
router.get('/alerts',              verifyAdmin, getAlerts);
router.patch('/alerts/:id/ack',    verifyAdmin, acknowledgeAlert);
router.delete('/alerts/:id',       verifyAdmin, deleteAlert);

// ==================== Thống kê & Trích xuất ====================
router.get('/export/measurements', verifyAdmin, exportMeasurements);

module.exports = router;

