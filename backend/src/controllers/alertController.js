const alertService = require('../services/alertService');

/**
 * GET /api/v1/admin/alerts
 * Lấy danh sách cảnh báo, hỗ trợ filter + phân trang
 *
 * Query params: node_id, type, severity, acknowledged, from, to, page, limit
 */
const getAlerts = async (req, res) => {
  try {
    const data = await alertService.getAlerts(req.query);
    res.json({ success: true, ...data });
  } catch (error) {
    console.error('[Admin] Lỗi lấy alerts:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi lấy danh sách cảnh báo' });
  }
};

/**
 * PATCH /api/v1/admin/alerts/:id/ack
 * Xác nhận (acknowledge) 1 cảnh báo
 */
const acknowledgeAlert = async (req, res) => {
  try {
    const data = await alertService.acknowledgeAlert(req.params.id);
    console.log(`[Admin] Đã xác nhận alert #${req.params.id}`);
    res.json({ success: true, data });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: error.message });
    }
    console.error('[Admin] Lỗi xác nhận alert:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi xác nhận cảnh báo' });
  }
};

/**
 * DELETE /api/v1/admin/alerts/:id
 * Xóa 1 cảnh báo
 */
const deleteAlert = async (req, res) => {
  try {
    const data = await alertService.deleteAlert(req.params.id);
    console.log(`[Admin] Đã xóa alert #${req.params.id}`);
    res.json({ success: true, message: 'Đã xóa cảnh báo thành công', data });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: error.message });
    }
    console.error('[Admin] Lỗi xóa alert:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi xóa cảnh báo' });
  }
};

module.exports = { getAlerts, acknowledgeAlert, deleteAlert };
