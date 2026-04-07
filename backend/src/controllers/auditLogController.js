const auditLogService = require('../services/auditLogService');

/**
 * GET /api/v1/admin/logs
 * Lấy lịch sử hành động admin, hỗ trợ filter + phân trang
 *
 * Query params: username, action, resource, from, to, page, limit
 */
const getLogs = async (req, res) => {
  try {
    const data = await auditLogService.getLogs(req.query);
    res.json({ success: true, ...data });
  } catch (error) {
    console.error('[Admin] Lỗi lấy audit logs:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi lấy lịch sử hành động' });
  }
};

module.exports = { getLogs };
