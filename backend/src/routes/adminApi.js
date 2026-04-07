const express = require('express');
const router = express.Router();

// Middlewares
const { verifyAdmin } = require('../middlewares/authMiddleware');
const { validateGatewayBody, validateNodeBody } = require('../validations/adminValidation');

// Controllers
const { login } = require('../controllers/authController');
const {
  getGateways, createGateway, updateGateway, deleteGateway,
  getNodes, createNode, updateNode, deleteNode,
} = require('../controllers/adminDeviceController');
const { exportMeasurements } = require('../controllers/exportController');

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

// ==================== Thống kê & Trích xuất ====================
router.get('/export/measurements', verifyAdmin, exportMeasurements);

module.exports = router;
