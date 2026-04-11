const { getDashboardStats } = require('../services/adminDashboardService');

/**
 * GET /api/v1/admin/dashboard/stats
 * Trả về thống kê tổng hợp cho Admin Dashboard.
 */
async function getAdminDashboardStats(req, res) {
  try {
    const data = await getDashboardStats();
    res.json({ success: true, data });
  } catch (error) {
    console.error('[Admin Dashboard] Error:', error);
    res.status(500).json({ success: false, error: 'Lỗi khi lấy thống kê dashboard' });
  }
}

module.exports = { getAdminDashboardStats };
