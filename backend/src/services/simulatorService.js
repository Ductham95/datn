/**
 * Simulator Service
 * Logic sinh dữ liệu giả lập cho sensor nodes (backfill + realtime)
 */

const prisma = require('../config/prismaClient');

/**
 * Sinh dữ liệu sensor realistic với biến thiên theo giờ trong ngày
 */
function generateMeasurement(timestamp) {
  const hour = timestamp.getHours();

  let pollutionFactor;
  if (hour >= 6 && hour < 9) pollutionFactor = 0.7;
  else if (hour >= 9 && hour < 11) pollutionFactor = 0.5;
  else if (hour >= 11 && hour < 14) pollutionFactor = 0.4;
  else if (hour >= 14 && hour < 17) pollutionFactor = 0.5;
  else if (hour >= 17 && hour < 20) pollutionFactor = 0.9;
  else if (hour >= 20 && hour < 23) pollutionFactor = 0.6;
  else pollutionFactor = 0.3;

  const noise = () => 0.8 + Math.random() * 0.4;

  return {
    pm25: +(5 + 70 * pollutionFactor * noise()).toFixed(1),
    pm10: +(10 + 100 * pollutionFactor * noise()).toFixed(1),
    co2:  Math.round(400 + 800 * pollutionFactor * noise()),
    tvoc: Math.round(50 * pollutionFactor * noise()),
    temperature: +(24 + 8 * Math.sin((hour - 6) * Math.PI / 12) + (Math.random() - 0.5) * 2).toFixed(1),
    humidity: +(65 - 20 * Math.sin((hour - 6) * Math.PI / 12) + (Math.random() - 0.5) * 5).toFixed(1),
  };
}

/**
 * Backfill: Ghi dữ liệu lịch sử trực tiếp vào DB
 * @param {string[]} nodeIds - Danh sách node_id
 * @param {Date} from - Thời gian bắt đầu
 * @param {Date} to - Thời gian kết thúc
 * @param {number} intervalMinutes - Khoảng cách giữa các bản ghi (phút)
 * @returns {{ created: number }}
 */
async function backfill(nodeIds, from, to, intervalMinutes) {
  const BATCH_SIZE = 500;
  let batch = [];
  let created = 0;

  let cursor = new Date(from);
  while (cursor <= to) {
    for (const nodeId of nodeIds) {
      batch.push({
        time: new Date(cursor),
        node_id: nodeId,
        ...generateMeasurement(cursor),
      });

      if (batch.length >= BATCH_SIZE) {
        await prisma.measurement.createMany({ data: batch, skipDuplicates: true });
        created += batch.length;
        batch = [];
      }
    }
    cursor = new Date(cursor.getTime() + intervalMinutes * 60000);
  }

  if (batch.length > 0) {
    await prisma.measurement.createMany({ data: batch, skipDuplicates: true });
    created += batch.length;
  }

  return { created };
}

/**
 * Lấy danh sách node_id hiện có trong DB
 */
async function getNodeIds() {
  const nodes = await prisma.sensorNode.findMany({
    select: { id: true, name: true },
    orderBy: { id: 'asc' },
  });
  return nodes;
}

/**
 * Bulk provision: Tạo nhiều node cùng lúc
 * Tự tạo gateway nếu chưa tồn tại. Bỏ qua node trùng tên.
 */
async function bulkProvision(nodeDefs) {
  const deviceService = require('./deviceService');
  const results = { created: 0, skipped: 0, errors: 0, nodes: [] };

  // Tự tạo gateway nếu cần (thu thập tất cả gateway_id unique)
  const gatewayIds = [...new Set(nodeDefs.map(d => d.gateway_id).filter(Boolean))];
  for (const gwId of gatewayIds) {
    const existing = await prisma.gateway.findUnique({ where: { id: gwId } });
    if (!existing) {
      try {
        await prisma.gateway.create({
          data: { id: gwId, name: `Gateway ${gwId}`, status: 'online' },
        });
        console.log(`[Simulator] Tự tạo gateway "${gwId}"`);
      } catch (err) {
        console.error(`[Simulator] Lỗi tạo gateway "${gwId}":`, err.message);
      }
    }
  }

  for (const def of nodeDefs) {
    // Check duplicate by name
    const existing = await prisma.sensorNode.findFirst({
      where: { name: def.name },
      select: { id: true, name: true },
    });

    if (existing) {
      results.skipped++;
      results.nodes.push({ id: existing.id, name: existing.name, status: 'skipped' });
      continue;
    }

    try {
      const node = await deviceService.createNode({
        name: def.name,
        gateway_id: def.gateway_id || null,
        lat: def.lat,
        lng: def.lng,
        status: 'active',
        battery_level: 100,
      });
      results.created++;
      results.nodes.push({ id: node.id, name: node.name, status: 'created' });
    } catch (err) {
      results.errors++;
      console.error(`[Simulator] Lỗi tạo node "${def.name}":`, err.message);
      results.nodes.push({ name: def.name, status: 'error', error: err.message });
    }
  }

  return results;
}

// ==================== REALTIME SIMULATION ====================

let realtimeState = {
  running: false,
  intervalId: null,
  nodeIds: [],
  intervalSeconds: 10,
  tickCount: 0,
  startedAt: null,
};

/**
 * Start realtime simulation
 * Gửi data qua telemetry pipeline (processTelemetry) để Socket.IO broadcast hoạt động
 */
function startRealtime(nodeIds, intervalSeconds, io) {
  if (realtimeState.running) {
    return { success: false, error: 'Realtime đang chạy. Dừng trước khi bắt đầu mới.' };
  }

  const { processTelemetry } = require('./telemetryService');
  const { calculateAQI } = require('./aqiService');

  realtimeState = {
    running: true,
    nodeIds,
    intervalSeconds,
    tickCount: 0,
    startedAt: new Date(),
    intervalId: null,
  };

  const tick = async () => {
    const timestamp = new Date();
    const data = nodeIds.map(nodeId => ({
      node_id: nodeId,
      ...generateMeasurement(timestamp),
      battery: 80 + Math.floor(Math.random() * 20),
      rssi: -40 - Math.floor(Math.random() * 40),
    }));

    // Tìm gateway_id từ node đầu tiên
    try {
      const firstNode = await prisma.sensorNode.findUnique({
        where: { id: nodeIds[0] },
        select: { gateway_id: true },
      });
      const gatewayId = firstNode?.gateway_id || 'GW_001';

      await processTelemetry(gatewayId, data);

      // Broadcast qua Socket.IO
      if (io) {
        const enrichedData = data.map(item => ({
          ...item,
          aqi: calculateAQI(item.pm25 || 0, item.pm10 || 0),
          time: timestamp,
        }));
        io.emit('new_telemetry_data', { gateway_id: gatewayId, data: enrichedData });
      }

      realtimeState.tickCount++;
      console.log(`[Simulator] Realtime tick #${realtimeState.tickCount}: ${data.length} records`);
    } catch (err) {
      console.error('[Simulator] Realtime tick error:', err.message);
    }
  };

  // Gửi ngay tick đầu tiên, rồi lặp lại
  tick();
  realtimeState.intervalId = setInterval(tick, intervalSeconds * 1000);

  console.log(`[Simulator] Realtime started: ${nodeIds.length} nodes, every ${intervalSeconds}s`);
  return { success: true };
}

function stopRealtime() {
  if (!realtimeState.running) {
    return { success: false, error: 'Realtime không đang chạy.' };
  }

  clearInterval(realtimeState.intervalId);
  const result = {
    success: true,
    tickCount: realtimeState.tickCount,
    duration: Math.round((Date.now() - realtimeState.startedAt) / 1000),
  };

  realtimeState = { running: false, intervalId: null, nodeIds: [], intervalSeconds: 10, tickCount: 0, startedAt: null };
  console.log('[Simulator] Realtime stopped');
  return result;
}

function getRealtimeStatus() {
  return {
    running: realtimeState.running,
    nodeCount: realtimeState.nodeIds.length,
    intervalSeconds: realtimeState.intervalSeconds,
    tickCount: realtimeState.tickCount,
    startedAt: realtimeState.startedAt,
  };
}

module.exports = { backfill, getNodeIds, generateMeasurement, bulkProvision, startRealtime, stopRealtime, getRealtimeStatus };
