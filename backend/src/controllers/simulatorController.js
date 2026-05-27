/**
 * Simulator Controller
 * API endpoint cho admin chạy backfill dữ liệu giả lập
 */

const simulatorService = require('../services/simulatorService');

/**
 * POST /api/v1/admin/simulator/backfill
 * Body: { nodeIds: string[], from: string, to: string, intervalMinutes: number }
 */
const runBackfill = async (req, res) => {
  const { nodeIds, from, to, intervalMinutes = 5 } = req.body;

  // Validate
  if (!nodeIds || !Array.isArray(nodeIds) || nodeIds.length === 0) {
    return res.status(400).json({ success: false, error: 'nodeIds là bắt buộc (mảng không rỗng)' });
  }
  if (!from || !to) {
    return res.status(400).json({ success: false, error: 'from và to là bắt buộc' });
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return res.status(400).json({ success: false, error: 'from/to không phải ngày hợp lệ' });
  }
  if (fromDate >= toDate) {
    return res.status(400).json({ success: false, error: 'from phải trước to' });
  }

  try {
    console.log(`[Simulator] Backfill: ${nodeIds.length} nodes, ${from} → ${to}, interval=${intervalMinutes}min`);
    const result = await simulatorService.backfill(nodeIds, fromDate, toDate, intervalMinutes);
    console.log(`[Simulator] Hoàn tất: ${result.created} bản ghi`);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[Simulator] Lỗi backfill:', error);
    res.status(500).json({ success: false, error: 'Lỗi server khi chạy backfill' });
  }
};

/**
 * POST /api/v1/admin/simulator/provision
 * Body: { nodes: [{ name, gateway_id?, lat?, lng? }] }
 */
const bulkProvision = async (req, res) => {
  const { nodes: nodeDefs } = req.body;

  if (!nodeDefs || !Array.isArray(nodeDefs) || nodeDefs.length === 0) {
    return res.status(400).json({ success: false, error: 'nodes là bắt buộc (mảng không rỗng)' });
  }

  try {
    console.log(`[Simulator] Provision: ${nodeDefs.length} nodes`);
    const result = await simulatorService.bulkProvision(nodeDefs);
    console.log(`[Simulator] Provision hoàn tất: ${result.created} created, ${result.skipped} skipped`);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[Simulator] Lỗi provision:', error);
    res.status(500).json({ success: false, error: 'Lỗi server khi tạo nodes' });
  }
};

/**
 * GET /api/v1/admin/simulator/nodes
 * Lấy danh sách node để hiển thị trong UI
 */
const getNodes = async (req, res) => {
  try {
    const nodes = await simulatorService.getNodeIds();
    res.json({ success: true, data: nodes });
  } catch (error) {
    console.error('[Simulator] Lỗi lấy nodes:', error);
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

/**
 * POST /api/v1/admin/simulator/realtime/start
 * Body: { nodeIds: string[], intervalSeconds: number }
 */
const startRealtime = (req, res) => {
  const { nodeIds, intervalSeconds = 10 } = req.body;

  if (!nodeIds || !Array.isArray(nodeIds) || nodeIds.length === 0) {
    return res.status(400).json({ success: false, error: 'nodeIds là bắt buộc' });
  }

  const result = simulatorService.startRealtime(nodeIds, intervalSeconds, req.io);
  if (!result.success) {
    return res.status(409).json(result);
  }
  res.json({ success: true, message: `Realtime started: ${nodeIds.length} nodes, every ${intervalSeconds}s` });
};

/**
 * POST /api/v1/admin/simulator/realtime/stop
 */
const stopRealtime = (req, res) => {
  const result = simulatorService.stopRealtime();
  if (!result.success) {
    return res.status(409).json(result);
  }
  res.json({ success: true, data: result });
};

/**
 * GET /api/v1/admin/simulator/realtime/status
 */
const getRealtimeStatus = (req, res) => {
  res.json({ success: true, data: simulatorService.getRealtimeStatus() });
};

module.exports = { runBackfill, getNodes, bulkProvision, startRealtime, stopRealtime, getRealtimeStatus };
