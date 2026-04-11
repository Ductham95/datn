const prisma = require('../config/prismaClient');
const { calculateAQI } = require('./aqiService');

/**
 * Lấy danh sách telemetry logs (raw measurements) với filter + giới hạn
 * @param {Object} filters - { node_id, gateway_id, from, to, limit }
 * @returns {{ logs: Array, total: number }}
 */
const getTelemetryLogs = async (filters = {}) => {
  const { node_id, gateway_id, from, to, limit = 500 } = filters;

  // Giới hạn tối đa 500 records mỗi lần query
  const take = Math.min(parseInt(limit) || 500, 500);

  // Xây dựng điều kiện WHERE
  const where = {};

  // Filter theo node_id
  if (node_id) {
    where.node_id = node_id;
  }

  // Filter theo gateway_id (cần lấy danh sách node_ids thuộc gateway)
  if (gateway_id && !node_id) {
    const nodes = await prisma.sensorNode.findMany({
      where: { gateway_id },
      select: { id: true },
    });
    const nodeIds = nodes.map(n => n.id);
    if (nodeIds.length === 0) {
      return { logs: [], total: 0 };
    }
    where.node_id = { in: nodeIds };
  }

  // Filter theo khoảng thời gian
  if (from || to) {
    where.time = {};
    if (from) where.time.gte = new Date(from);
    if (to) where.time.lte = new Date(to);
  }

  // Query đếm tổng (cho UI biết có bao nhiêu records khớp filter)
  const total = await prisma.measurement.count({ where });

  // Query dữ liệu measurements
  const measurements = await prisma.measurement.findMany({
    where,
    orderBy: { time: 'desc' },
    take,
  });

  // Lấy thông tin tên node để enrich data
  const nodeIds = [...new Set(measurements.map(m => m.node_id))];
  const nodes = await prisma.sensorNode.findMany({
    where: { id: { in: nodeIds } },
    select: { id: true, name: true, gateway_id: true },
  });
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  // Enrich: thêm node_name, gateway_id, AQI
  const logs = measurements.map(m => ({
    time: m.time,
    node_id: m.node_id,
    node_name: nodeMap[m.node_id]?.name || m.node_id,
    gateway_id: nodeMap[m.node_id]?.gateway_id || null,
    pm25: m.pm25,
    pm10: m.pm10,
    co2: m.co2,
    tvoc: m.tvoc,
    temperature: m.temperature,
    humidity: m.humidity,
    aqi: calculateAQI(m.pm25 || 0, m.pm10 || 0),
  }));

  return { logs, total };
};

module.exports = { getTelemetryLogs };
