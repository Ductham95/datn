const alertConfigService = require('../services/alertConfigService');

/**
 * GET /api/v1/admin/config
 * Lấy cấu hình ngưỡng cảnh báo hiện tại
 */
const getConfig = async (req, res) => {
  try {
    const data = await alertConfigService.getConfig();
    res.json({ success: true, data });
  } catch (error) {
    console.error('[Admin] Lỗi lấy config:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi lấy cấu hình' });
  }
};

/**
 * PUT /api/v1/admin/config
 * Cập nhật cấu hình ngưỡng cảnh báo (partial update)
 */
const updateConfig = async (req, res) => {
  try {
    const data = await alertConfigService.updateConfig(req.body);
    console.log('[Admin] Đã cập nhật cấu hình ngưỡng cảnh báo');
    res.json({ success: true, data });
  } catch (error) {
    console.error('[Admin] Lỗi cập nhật config:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi cập nhật cấu hình' });
  }
};

module.exports = { getConfig, updateConfig };
