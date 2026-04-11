const prisma = require('../config/prismaClient');
const { calculateAQI, getAQIInfo } = require('./aqiService');

/**
 * Lấy thống kê tổng hợp cho Admin Dashboard.
 * Bao gồm: đếm nodes/gateways, alerts chưa xử lý, AQI trung bình,
 * danh sách AQI per node, 5 alerts gần nhất, 5 audit logs gần nhất,
 * và system uptime 24h.
 */
async function getDashboardStats() {
  // ── 1. Đếm Sensor Nodes theo trạng thái ──
  const nodeStats = await prisma.$queryRaw`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'active')::int AS active,
      COUNT(*) FILTER (WHERE status = 'inactive')::int AS inactive,
      COUNT(*) FILTER (WHERE status NOT IN ('active', 'inactive'))::int AS lost_connection
    FROM sensor_nodes
  `;

  // ── 2. Đếm Gateways theo trạng thái ──
  const gatewayStats = await prisma.$queryRaw`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'online')::int AS online,
      COUNT(*) FILTER (WHERE status = 'offline')::int AS offline
    FROM gateways
  `;

  // ── 3. Đếm Alerts chưa xác nhận ──
  const alertStats = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS unacknowledged
    FROM alerts
    WHERE acknowledged = false
  `;

  // ── 4. Lấy AQI hiện tại per node (latest measurement) ──
  const nodeAqiRows = await prisma.$queryRaw`
    SELECT
      n.id AS node_id,
      n.name,
      n.status,
      n.battery_level,
      n.lora_rssi,
      m.pm25, m.pm10, m.time
    FROM sensor_nodes n
    LEFT JOIN LATERAL (
      SELECT pm25, pm10, time FROM measurements
      WHERE node_id = n.id
      ORDER BY time DESC
      LIMIT 1
    ) m ON true
    ORDER BY n.name
  `;

  const nodeAqiList = nodeAqiRows.map(row => {
    const aqi = calculateAQI(Number(row.pm25) || 0, Number(row.pm10) || 0);
    return {
      node_id: row.node_id,
      name: row.name,
      status: row.status,
      battery_level: row.battery_level,
      lora_rssi: row.lora_rssi,
      aqi,
      aqi_info: getAQIInfo(aqi),
      last_measurement: row.time || null,
    };
  });

  // Tính AQI trung bình
  const validAqis = nodeAqiList.filter(n => n.aqi != null && n.last_measurement != null);
  const avgAqi = validAqis.length > 0
    ? Math.round(validAqis.reduce((sum, n) => sum + n.aqi, 0) / validAqis.length)
    : 0;

  // ── 5. 5 Alerts gần nhất ──
  const recentAlerts = await prisma.alert.findMany({
    orderBy: { created_at: 'desc' },
    take: 5,
    select: {
      id: true,
      node_id: true,
      type: true,
      severity: true,
      metric: true,
      value: true,
      threshold: true,
      message: true,
      acknowledged: true,
      created_at: true,
    },
  });

  // ── 6. 5 Audit Logs gần nhất ──
  const recentLogs = await prisma.auditLog.findMany({
    orderBy: { created_at: 'desc' },
    take: 5,
    select: {
      id: true,
      username: true,
      action: true,
      resource: true,
      resource_id: true,
      created_at: true,
    },
  });

  // ── 7. System Uptime 24h ──
  // Uptime = tỷ lệ thời gian các gateway online trong 24h gần nhất
  // Logic: (tổng gateways online hiện tại / tổng gateways) * 100
  // Kết hợp tỷ lệ nodes active
  const gw = gatewayStats[0];
  const nd = nodeStats[0];

  let uptime = 0;
  const totalDevices = (gw.total || 0) + (nd.total || 0);
  if (totalDevices > 0) {
    const onlineDevices = (gw.online || 0) + (nd.active || 0);
    uptime = Math.round((onlineDevices / totalDevices) * 100);
  }

  return {
    nodes: nodeStats[0],
    gateways: gatewayStats[0],
    alerts: alertStats[0],
    avgAqi,
    avgAqiInfo: getAQIInfo(avgAqi),
    nodeAqiList,
    recentAlerts,
    recentLogs,
    uptime,
  };
}

module.exports = { getDashboardStats };
