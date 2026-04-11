const cron = require('node-cron');
const prisma = require('../config/prismaClient');
const { createConnectivityAlerts, cleanupOldAlerts } = require('./alertService');

/**
 * Khởi chạy các công việc chạy nền (Background Jobs)
 */
function startBackgroundJobs() {
  console.log('[Cron] Đã khởi động Hệ thống giám sát tình trạng mạng (chạy mỗi 5 phút)');

  // ==================== Job 1: Check Gateway và Node Offline ====================
  // Chạy mỗi 5 phút một lần
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('[Cron] Đang quét Health check mạng LoRa...');

      // Lấy danh sách thiết bị SẮP chuyển offline (để tạo connectivity alerts)
      const gatewaysGoingOffline = await prisma.$queryRaw`
        SELECT id, name FROM gateways
        WHERE status != 'offline'
          AND EXTRACT(EPOCH FROM (NOW() - last_seen)) > 600
      `;

      const nodesGoingOffline = await prisma.$queryRaw`
        SELECT sn.id, sn.name FROM sensor_nodes sn
        WHERE sn.status != 'offline'
          AND (
            sn.id IN (
              SELECT node_id
              FROM (
                SELECT node_id, MAX(time) as last_time
                FROM measurements
                GROUP BY node_id
              ) AS latest
              WHERE EXTRACT(EPOCH FROM (NOW() - last_time)) > 900
            )
            OR (
              sn.last_seen IS NULL
              AND sn.id NOT IN (SELECT DISTINCT node_id FROM measurements)
            )
          )
      `;

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

        // 2. Chuyển Sensor Node thành Offline nếu:
        //    - Không có dữ liệu đo mới nhất trong 15 phút, HOẶC
        //    - Chưa bao giờ gửi dữ liệu (last_seen IS NULL và không có measurements)
        const offlineNodeCount = await tx.$executeRaw`
          UPDATE sensor_nodes
          SET status = 'offline'
          WHERE status != 'offline'
            AND (
              id IN (
                SELECT node_id
                FROM (
                  SELECT node_id, MAX(time) as last_time
                  FROM measurements
                  GROUP BY node_id
                ) AS latest
                WHERE EXTRACT(EPOCH FROM (NOW() - last_time)) > 900
              )
              OR (
                last_seen IS NULL
                AND id NOT IN (SELECT DISTINCT node_id FROM measurements)
              )
            )
        `;

        if (offlineNodeCount > 0) {
          console.log(`[Cron] Đã chuyển trạng thái offline cho ${offlineNodeCount} Sensor Node!`);
        }
      });

      // Tạo connectivity alerts cho các thiết bị vừa chuyển offline
      if (gatewaysGoingOffline.length > 0) {
        await createConnectivityAlerts('gateway', gatewaysGoingOffline);
      }
      if (nodesGoingOffline.length > 0) {
        await createConnectivityAlerts('node', nodesGoingOffline);
      }

    } catch (error) {
      console.error('[Cron Error] Lỗi khi chạy Health check:', error);
    }
  });

  // ==================== Job 2: Dọn dẹp alerts cũ (> 30 ngày) ====================
  // Chạy mỗi ngày lúc 2:00 sáng
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('[Cron] Đang dọn dẹp alerts cũ...');
      await cleanupOldAlerts();
    } catch (error) {
      console.error('[Cron Error] Lỗi khi dọn dẹp alerts:', error);
    }
  });

  console.log('[Cron] Đã khởi động Job dọn dẹp alerts (chạy lúc 2:00 sáng hàng ngày)');
}

module.exports = { startBackgroundJobs };

