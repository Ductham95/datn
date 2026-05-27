const express = require('express');
const router = express.Router();

// Middlewares
const { verifyAdmin } = require('../middlewares/authMiddleware');
const { auditLogger } = require('../middlewares/auditLogMiddleware');
const { validateGatewayBody, validateNodeBody } = require('../validations/adminValidation');
const { validateConfigBody } = require('../validations/configValidation');
const { validateUserBody } = require('../validations/userValidation');

// Controllers
const { login } = require('../controllers/authController');
const {
  getGateways, createGateway, updateGateway, deleteGateway,
  getNodes, createNode, updateNode, deleteNode,
} = require('../controllers/adminDeviceController');
const { exportMeasurements } = require('../controllers/exportController');
const { getConfig, updateConfig } = require('../controllers/alertConfigController');
const { getAlerts, acknowledgeAlert, deleteAlert } = require('../controllers/alertController');
const { getUsers, createUser, updateUser, deleteUser, changePassword } = require('../controllers/userController');
const { getLogs } = require('../controllers/auditLogController');
const { getAdminDashboardStats } = require('../controllers/adminDashboardController');
const { getTelemetryLogsHandler } = require('../controllers/telemetryLogController');
const { runBackfill, getNodes: getSimulatorNodes, startRealtime, stopRealtime, getRealtimeStatus } = require('../controllers/simulatorController');

// ==================== Audit Logger (tự động ghi log mọi thao tác admin) ====================
router.use(auditLogger);

// ==================== Xác thực ====================
router.post('/login', login);

// ==================== Dashboard Stats ====================
router.get('/dashboard/stats', verifyAdmin, getAdminDashboardStats);

// ==================== Telemetry Logs ====================
router.get('/telemetry-logs', verifyAdmin, getTelemetryLogsHandler);

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

// ==================== Quản lý tài khoản ====================
router.put('/users/change-password', verifyAdmin, changePassword);
router.get('/users',                 verifyAdmin, getUsers);
router.post('/users',                verifyAdmin, validateUserBody, createUser);
router.put('/users/:id',            verifyAdmin, validateUserBody, updateUser);
router.delete('/users/:id',         verifyAdmin, deleteUser);

// ==================== Log hệ thống ====================
router.get('/logs',                  verifyAdmin, getLogs);

// ==================== Thống kê & Trích xuất ====================
router.get('/export/measurements', verifyAdmin, exportMeasurements);

// ==================== Simulator (Dev tool) ====================
router.get('/simulator/nodes',          verifyAdmin, getSimulatorNodes);
router.post('/simulator/backfill',      verifyAdmin, runBackfill);
router.post('/simulator/realtime/start', verifyAdmin, startRealtime);
router.post('/simulator/realtime/stop',  verifyAdmin, stopRealtime);
router.get('/simulator/realtime/status', verifyAdmin, getRealtimeStatus);

module.exports = router;

