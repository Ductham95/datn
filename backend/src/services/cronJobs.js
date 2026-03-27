const cron = require('node-cron');
const prisma = require('../config/prismaClient');

/**
 * Khởi chạy các công việc chạy nền (Background Jobs)
 */
function startBackgroundJobs() {
  console.log('[Cron] Đã khởi động Hệ thống giám sát tình trạng mạng (chạy mỗi 5 phút)');

  // Job 1: Check Gateway và Node Offline
  // Chạy mỗi 5 phút một lần
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('[Cron] Đang quét Health check mạng LoRa...');

      await prisma.$transaction(async (tx) => {
        // 1. Cập nhật Gateway thành Offline nếu không nhận được bản tin nào trong vòng 10 phút (600 giây)
        const offlineGatewayCount = await tx.$executeRaw`
          UPDATE gateways 
          SET status = 'offline' 
          WHERE status != 'offline' 
            AND EXTRACT(EPOCH FROM (NOW() - last_seen)) > 600
        `;

        if (offlineGatewayCount > 0) {
          console.log(`[Cron] Đã chuyển trạng thái offline cho ${offlineGatewayCount} Gateway!`);
        }

        // 2. Chuyển Sensor Node thành Offline nếu không có dữ liệu đo mới nhất trong 15 phút
        const offlineNodeCount = await tx.$executeRaw`
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
        `;

        if (offlineNodeCount > 0) {
          console.log(`[Cron] Đã chuyển trạng thái offline cho ${offlineNodeCount} Sensor Node!`);
          // TODO: (Mở rộng) Viết logic Push Notification/Gửi Email Cảnh báo mất mạng tại đây
        }
      });

    } catch (error) {
      console.error('[Cron Error] Lỗi khi chạy Health check:', error);
    }
  });
}

module.exports = { startBackgroundJobs };
