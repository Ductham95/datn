/**
 * Provisioning API Routes
 * Cho phép thiết bị (Gateway/Sensor Node) tự đăng ký với server
 * Xác thực bằng provision_key (không cần JWT)
 */

const express = require('express');
const router = express.Router();

const {
  verifyProvisionKey,
  validateProvisionGateway,
  validateProvisionNode,
} = require('../validations/provisionValidation');

const {
  provisionGateway,
  listGateways,
  provisionNode,
} = require('../controllers/provisionController');

// POST /api/v1/provision/gateway — Gateway tự đăng ký
router.post('/gateway', verifyProvisionKey, validateProvisionGateway, provisionGateway);

// GET /api/v1/provision/gateways — Lấy danh sách gateway cho sensor node chọn
router.get('/gateways', verifyProvisionKey, listGateways);

// POST /api/v1/provision/node — Sensor node tự đăng ký
router.post('/node', verifyProvisionKey, validateProvisionNode, provisionNode);

module.exports = router;
