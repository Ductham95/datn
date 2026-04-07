const prisma = require('../config/prismaClient');

// Cooldown: không tạo alert trùng (cùng node + cùng metric) trong 15 phút
const ALERT_COOLDOWN_MINUTES = 15;

// Nhãn hiển thị cho từng metric
const METRIC_LABELS = {
  pm25: 'PM2.5',
  pm10: 'PM10',
  co2: 'CO₂',
  tvoc: 'TVOC',
  temperature: 'Nhiệt độ',
};

// ==================== CRUD ====================

/**
 * Lấy danh sách alerts, hỗ trợ filter + phân trang
 * @param {Object} filters - { node_id, type, severity, acknowledged, from, to, page, limit }
 */
const getAlerts = async (filters = {}) => {
  const {
    node_id,
    type,
    severity,
    acknowledged,
    from,
    to,
    page = 1,
    limit = 50,
  } = filters;

  const where = {};

  if (node_id) where.node_id = node_id;
  if (type) where.type = type;
  if (severity) where.severity = severity;
  if (acknowledged !== undefined) where.acknowledged = acknowledged === 'true' || acknowledged === true;

  // Filter theo khoảng thời gian
  if (from || to) {
    where.created_at = {};
    if (from) where.created_at.gte = new Date(from);
    if (to) where.created_at.lte = new Date(to);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take,
    }),
    prisma.alert.count({ where }),
  ]);

  return {
    alerts,
    pagination: {
      page: parseInt(page),
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

/**
 * Xác nhận (acknowledge) 1 alert
 */
const acknowledgeAlert = async (id) => {
  const alertId = parseInt(id);

  const existing = await prisma.alert.findUnique({ where: { id: alertId } });
  if (!existing) {
    const error = new Error('Alert không tồn tại');
    error.code = 'NOT_FOUND';
    throw error;
  }

  return prisma.alert.update({
    where: { id: alertId },
    data: { acknowledged: true },
  });
};

/**
 * Xóa 1 alert
 */
const deleteAlert = async (id) => {
  const alertId = parseInt(id);

  const existing = await prisma.alert.findUnique({ where: { id: alertId } });
  if (!existing) {
    const error = new Error('Alert không tồn tại');
    error.code = 'NOT_FOUND';
    throw error;
  }

  await prisma.alert.delete({ where: { id: alertId } });
  return { id: alertId, message: existing.message };
};

// ==================== THRESHOLD CHECK ====================

/**
 * Kiểm tra reading so với ngưỡng config → tạo alerts nếu vượt ngưỡng.
 * Có cooldown 15 phút: không tạo trùng (cùng node + cùng metric).
 *
 * @param {string} nodeId - ID node gửi dữ liệu
 * @param {Object} reading - { pm25, pm10, co2, tvoc, temperature }
 * @returns {Array} Danh sách alerts vừa tạo (có thể rỗng)
 */
const checkThresholdsAndCreateAlerts = async (nodeId, reading) => {
  // 1. Lấy config
  let config = await prisma.alertConfig.findUnique({ where: { id: 'default' } });
  if (!config) return []; // Chưa có config → bỏ qua

  // 2. Xác định các metric cần kiểm tra
  const checks = [];

  if (reading.pm25 != null) {
    if (reading.pm25 >= config.pm25_danger) {
      checks.push({ metric: 'pm25', severity: 'danger', value: reading.pm25, threshold: config.pm25_danger });
    } else if (reading.pm25 >= config.pm25_warn) {
      checks.push({ metric: 'pm25', severity: 'warn', value: reading.pm25, threshold: config.pm25_warn });
    }
  }

  if (reading.pm10 != null) {
    if (reading.pm10 >= config.pm10_danger) {
      checks.push({ metric: 'pm10', severity: 'danger', value: reading.pm10, threshold: config.pm10_danger });
    } else if (reading.pm10 >= config.pm10_warn) {
      checks.push({ metric: 'pm10', severity: 'warn', value: reading.pm10, threshold: config.pm10_warn });
    }
  }

  if (reading.co2 != null) {
    if (reading.co2 >= config.co2_danger) {
      checks.push({ metric: 'co2', severity: 'danger', value: reading.co2, threshold: config.co2_danger });
    } else if (reading.co2 >= config.co2_warn) {
      checks.push({ metric: 'co2', severity: 'warn', value: reading.co2, threshold: config.co2_warn });
    }
  }

  if (reading.tvoc != null) {
    if (reading.tvoc >= config.tvoc_danger) {
      checks.push({ metric: 'tvoc', severity: 'danger', value: reading.tvoc, threshold: config.tvoc_danger });
    } else if (reading.tvoc >= config.tvoc_warn) {
      checks.push({ metric: 'tvoc', severity: 'warn', value: reading.tvoc, threshold: config.tvoc_warn });
    }
  }

  if (reading.temperature != null) {
    if (reading.temperature < config.temp_min) {
      checks.push({ metric: 'temperature', severity: 'warn', value: reading.temperature, threshold: config.temp_min });
    } else if (reading.temperature > config.temp_max) {
      checks.push({ metric: 'temperature', severity: 'warn', value: reading.temperature, threshold: config.temp_max });
    }
  }

  if (checks.length === 0) return [];

  // 3. Cooldown: tìm alerts gần đây (trong 15 phút) cho node này
  const cooldownTime = new Date(Date.now() - ALERT_COOLDOWN_MINUTES * 60 * 1000);
  const recentAlerts = await prisma.alert.findMany({
    where: {
      node_id: nodeId,
      type: 'threshold',
      created_at: { gte: cooldownTime },
    },
    select: { metric: true },
  });

  const recentMetrics = new Set(recentAlerts.map(a => a.metric));

  // 4. Tạo alerts cho các metric chưa có alert gần đây
  const newAlerts = [];
  for (const check of checks) {
    if (recentMetrics.has(check.metric)) continue; // Cooldown

    const label = METRIC_LABELS[check.metric] || check.metric;
    const severityLabel = check.severity === 'danger' ? 'NGUY HIỂM' : 'Cảnh báo';

    const message = check.metric === 'temperature'
      ? `[${severityLabel}] ${label} tại ${nodeId}: ${check.value}°C (ngưỡng: ${check.threshold}°C)`
      : `[${severityLabel}] ${label} tại ${nodeId}: ${check.value} (ngưỡng: ${check.threshold})`;

    const alert = await prisma.alert.create({
      data: {
        node_id: nodeId,
        type: 'threshold',
        severity: check.severity,
        metric: check.metric,
        value: check.value,
        threshold: check.threshold,
        message,
      },
    });

    newAlerts.push(alert);
    console.log(`[Alert] ${message}`);
  }

  return newAlerts;
};

/**
 * Tạo connectivity alerts khi node/gateway mất kết nối.
 * Được gọi từ cronJobs.js
 *
 * @param {'node'|'gateway'} deviceType
 * @param {Array<{id: string, name: string}>} offlineDevices
 */
const createConnectivityAlerts = async (deviceType, offlineDevices) => {
  const cooldownTime = new Date(Date.now() - ALERT_COOLDOWN_MINUTES * 60 * 1000);
  const newAlerts = [];

  for (const device of offlineDevices) {
    // Cooldown check
    const recent = await prisma.alert.findFirst({
      where: {
        node_id: device.id,
        type: 'connectivity',
        created_at: { gte: cooldownTime },
      },
    });

    if (recent) continue;

    const label = deviceType === 'gateway' ? 'Gateway' : 'Sensor Node';
    const message = `[Mất kết nối] ${label} "${device.name}" (${device.id}) đã offline`;

    const alert = await prisma.alert.create({
      data: {
        node_id: device.id,
        type: 'connectivity',
        severity: 'warn',
        message,
      },
    });

    newAlerts.push(alert);
    console.log(`[Alert] ${message}`);
  }

  return newAlerts;
};

/**
 * Xóa alerts quá 30 ngày (retention policy).
 * Được gọi từ cronJobs.js
 */
const cleanupOldAlerts = async () => {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await prisma.alert.deleteMany({
    where: { created_at: { lt: cutoff } },
  });

  if (result.count > 0) {
    console.log(`[Alert Cleanup] Đã xóa ${result.count} alerts cũ hơn 30 ngày`);
  }

  return result.count;
};

module.exports = {
  getAlerts,
  acknowledgeAlert,
  deleteAlert,
  checkThresholdsAndCreateAlerts,
  createConnectivityAlerts,
  cleanupOldAlerts,
};
