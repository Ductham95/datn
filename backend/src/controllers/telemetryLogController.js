const { getTelemetryLogs } = require('../services/telemetryLogService');

/**
 * GET /api/v1/admin/telemetry-logs
 * Lấy danh sách telemetry logs (raw measurements) với filter
 * 
 * Query params: node_id, gateway_id, from, to, limit
 */
const getTelemetryLogsHandler = async (req, res) => {
  try {
    const { node_id, gateway_id, from, to, limit } = req.query;

    const result = await getTelemetryLogs({
      node_id,
      gateway_id,
      from,
      to,
      limit,
    });

    res.json({
      success: true,
      data: result.logs,
      total: result.total,
    });
  } catch (error) {
    console.error('[TelemetryLogs] Lỗi truy vấn:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể tải telemetry logs',
    });
  }
};

module.exports = { getTelemetryLogsHandler };
