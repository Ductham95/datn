const deviceService = require('../services/deviceService');

// ==================== READ (Giữ nguyên) ====================

const getGateways = async (req, res) => {
  try {
    const data = await deviceService.getAllGateways();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getNodes = async (req, res) => {
  try {
    const data = await deviceService.getAllNodes();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== GATEWAY CRUD ====================

const createGateway = async (req, res) => {
  const { name, location_desc } = req.body;

  try {
    const data = await deviceService.createGateway({ name, location_desc });
    console.log(`[Admin] Đã tạo Gateway: ${data.id} - ${data.name}`);
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('[Admin] Lỗi tạo Gateway:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi tạo gateway' });
  }
};

const updateGateway = async (req, res) => {
  const { id } = req.params;
  const { name, location_desc, status } = req.body;

  try {
    const data = await deviceService.updateGateway(id, { name, location_desc, status });
    console.log(`[Admin] Đã cập nhật Gateway: ${id}`);
    res.json({ success: true, data });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: error.message });
    }
    console.error('[Admin] Lỗi cập nhật Gateway:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi cập nhật gateway' });
  }
};

const deleteGateway = async (req, res) => {
  const { id } = req.params;

  try {
    const data = await deviceService.deleteGateway(id);
    console.log(`[Admin] Đã xóa Gateway: ${id} - ${data.name}`);
    res.json({ success: true, message: `Đã xóa gateway "${data.name}" thành công`, data });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: error.message });
    }
    console.error('[Admin] Lỗi xóa Gateway:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi xóa gateway' });
  }
};

// ==================== SENSOR NODE CRUD ====================

const createNode = async (req, res) => {
  const { name, gateway_id, lat, lng, status, battery_level } = req.body;

  try {
    const data = await deviceService.createNode({ name, gateway_id, lat, lng, status, battery_level });
    console.log(`[Admin] Đã tạo Sensor Node: ${data.id} - ${data.name}`);
    res.status(201).json({ success: true, data });
  } catch (error) {
    if (error.code === 'INVALID_REFERENCE') {
      return res.status(400).json({ success: false, error: error.message });
    }
    console.error('[Admin] Lỗi tạo Sensor Node:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi tạo sensor node' });
  }
};

const updateNode = async (req, res) => {
  const { id } = req.params;
  const { name, gateway_id, lat, lng, status, battery_level } = req.body;

  try {
    const data = await deviceService.updateNode(id, { name, gateway_id, lat, lng, status, battery_level });
    console.log(`[Admin] Đã cập nhật Sensor Node: ${id}`);
    res.json({ success: true, data });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (error.code === 'INVALID_REFERENCE') {
      return res.status(400).json({ success: false, error: error.message });
    }
    console.error('[Admin] Lỗi cập nhật Sensor Node:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi cập nhật sensor node' });
  }
};

const deleteNode = async (req, res) => {
  const { id } = req.params;

  try {
    const data = await deviceService.deleteNode(id);
    console.log(`[Admin] Đã xóa Sensor Node: ${id} - ${data.name}`);
    res.json({ success: true, message: `Đã xóa sensor node "${data.name}" thành công`, data });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (error.code === 'HAS_DEPENDENCIES') {
      return res.status(409).json({
        success: false,
        error: error.message,
        details: error.details,
      });
    }
    console.error('[Admin] Lỗi xóa Sensor Node:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi xóa sensor node' });
  }
};

module.exports = {
  // Read
  getGateways,
  getNodes,
  // Gateway CRUD
  createGateway,
  updateGateway,
  deleteGateway,
  // Node CRUD
  createNode,
  updateNode,
  deleteNode,
};
