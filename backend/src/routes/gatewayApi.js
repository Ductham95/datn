const express = require('express');
const router = express.Router();

const { validateGatewayPayload } = require('../validations/gatewayValidation');
const { ingestTelemetryData } = require('../controllers/telemetryController');

/**
 * Mạch nhận gói tin Telemetry (Từ các LoRa Gateway gửi lên Server)
 * GET /api/v1/telemetry
 */
router.post('/', validateGatewayPayload, ingestTelemetryData);

module.exports = router;
