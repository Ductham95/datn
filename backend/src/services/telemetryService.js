const prisma = require('../config/prismaClient');
const { checkThresholdsAndCreateAlerts } = require('./alertService');
const { isDuplicate } = require('../utils/dedupCache');

const processTelemetry = async (gateway_id, data) => {
  // 0. Dedup: Lọc bỏ gói tin trùng lặp khi nhiều Gateway cùng nhận
  const uniqueData = data.filter(item => {
    if (!item.node_id) return false;
    if (item.msg_id !== undefined && isDuplicate(item.node_id, item.msg_id)) {
      console.log(`[Dedup] Bỏ gói trùng: ${item.node_id}:${item.msg_id} (từ GW ${gateway_id})`);
      return false;
    }
    return true;
  });

  // Nếu tất cả đều trùng → chỉ cập nhật trạng thái gateway, skip insert
  // 1. Transaction: Lưu dữ liệu đo lường + cập nhật trạng thái thiết bị
  await prisma.$transaction(async (tx) => {
    // Cập nhật trạng thái Gateway
    await tx.gateway.update({
      where: { id: gateway_id },
      data: { status: 'online', last_seen: new Date() },
    });

    // Xử lý từng gói metric của các Sensor Node
    for (const item of uniqueData) {

      // Cập nhật thông tin pin và sóng của Node
      await tx.sensorNode.updateMany({
        where: { id: item.node_id },
        data: {
          battery_level: item.battery || 100,
          lora_rssi: item.rssi ? parseInt(item.rssi) : -50,
          status: 'active',
          last_seen: new Date(),
        },
      });

      // Lưu trữ dữ liệu đo lường
      await tx.measurement.create({
        data: {
          time: new Date(),
          node_id: item.node_id,
          pm25: item.pm25 || 0,
          pm10: item.pm10 || 0,
          co2: item.co2 || 400,
          tvoc: item.tvoc || 0,
          temperature: item.temperature || 0,
          humidity: item.humidity || 0,
        },
      });
    }
  });

  // 2. Kiểm tra ngưỡng cảnh báo (chạy ngoài transaction để không block ingestion)
  const allNewAlerts = [];
  for (const item of uniqueData) {
    try {
      const alerts = await checkThresholdsAndCreateAlerts(item.node_id, item);
      allNewAlerts.push(...alerts);
    } catch (err) {
      // Lỗi alert check không được ảnh hưởng đến telemetry pipeline
      console.error(`[Alert] Lỗi kiểm tra ngưỡng cho ${item.node_id}:`, err.message);
    }
  }

  return allNewAlerts;
};

const processHeartbeat = async (gateway_id) => {
  const gateway = await prisma.gateway.findUnique({ where: { id: gateway_id } });
  if (!gateway) {
    const err = new Error(`Gateway ${gateway_id} không tồn tại`);
    err.code = 'NOT_FOUND';
    throw err;
  }

  await prisma.gateway.update({
    where: { id: gateway_id },
    data: { status: 'online', last_seen: new Date() },
  });

  console.log(`[Heartbeat] Gateway ${gateway_id} — online`);
};

module.exports = { processTelemetry, processHeartbeat };

