const express = require('express');
const router = express.Router();

const { validateGatewayPayload } = require('../validations/gatewayValidation');
const { ingestTelemetryData, handleHeartbeat } = require('../controllers/telemetryController');

/**
 * Mạch nhận gói tin Telemetry (Từ các LoRa Gateway gửi lên Server)
 * POST /api/v1/telemetry
 */
router.post('/', validateGatewayPayload, ingestTelemetryData);

/**
 * Heartbeat từ Gateway (không chứa sensor data)
 * POST /api/v1/telemetry/heartbeat
 */
router.post('/heartbeat', handleHeartbeat);

module.exports = router;
