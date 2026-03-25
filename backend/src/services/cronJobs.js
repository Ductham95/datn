const cron = require('node-cron');
const { pool } = require('../config/db.config');

/**
 * Khởi chạy các công việc chạy nền (Background Jobs)
 */
function startBackgroundJobs() {
  console.log('[Cron] Đã khởi động Hệ thống giám sát tình trạng mạng (chạy mỗi 5 phút)');

  // Job 1: Check Gateway và Node Offline
  // Chạy mỗi 5 phút một lần
  cron.schedule('*/5 * * * *', async () => {
    const client = await pool.connect();
    try {
      console.log('[Cron] Đang quét Health check mạng LoRa...');
      await client.query('BEGIN');

      // 1. Cập nhật Gateway thành Offline nếu không nhận được bản tin nào trong vòng 10 phút (600 giây)
      const resGateways = await client.query(`
        UPDATE gateways 
        SET status = 'offline' 
        WHERE status != 'offline' 
          AND EXTRACT(EPOCH FROM (NOW() - last_seen)) > 600
        RETURNING id;
      `);

      if (resGateways.rows.length > 0) {
        console.log(`[Cron] Đã chuyển trạng thái offline cho ${resGateways.rows.length} Gateway!`);
      }

      // 2. Chuyển Sensor Node thành Offline nếu không có dữ liệu đo mới nhất trong 15 phút
      // Việc join lấy thời gian bản ghi cuối cùng của mỗi node
      const resNodes = await client.query(`
        UPDATE sensor_nodes
        SET status = 'offline'
        WHERE status != 'offline'
          AND id IN (
            SELECT node_id
            FROM (
              SELECT node_id, MAX(time) as last_time
              FROM measurements
              GROUP BY node_id
            ) AS latest
            WHERE EXTRACT(EPOCH FROM (NOW() - last_time)) > 900
          )
        RETURNING id;
      `);

      if (resNodes.rows.length > 0) {
        console.log(`[Cron] Đã chuyển trạng thái offline cho ${resNodes.rows.length} Sensor Node!`);

        // TODO: (Mở rộng) Viết logic Push Notification/Gửi Email Cảnh báo mất mạng tại đây
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[Cron Error] Lỗi khi chạy Health check:', error);
    } finally {
      client.release();
    }
  });
}

module.exports = { startBackgroundJobs };
