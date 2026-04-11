/**
 * Provision Controller
 * Xử lý request từ thiết bị tự đăng ký (không cần JWT)
 * Tái sử dụng deviceService cho logic CRUD
 */

const deviceService = require('../services/deviceService');

/**
 * POST /api/v1/provision/gateway
 * Gateway ESP32 tự đăng ký với server
 */
const provisionGateway = async (req, res) => {
  try {
    const { name, location_desc } = req.body;

    const gateway = await deviceService.createGateway({ name, location_desc });

    res.status(201).json({
      success: true,
      data: gateway,
    });
  } catch (error) {
    console.error('[Provision] Lỗi đăng ký gateway:', error.message);
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi đăng ký gateway',
    });
  }
};

/**
 * GET /api/v1/provision/gateways
 * Sensor node lấy danh sách gateway để chọn
 */
const listGateways = async (req, res) => {
  try {
    const gateways = await deviceService.getAllGateways();

    // Chỉ trả về các field cần thiết cho provisioning UI
    const data = gateways.map(gw => ({
      id: gw.id,
      name: gw.name,
      status: gw.status,
      location_desc: gw.location_desc,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Provision] Lỗi lấy danh sách gateway:', error.message);
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi lấy danh sách gateway',
    });
  }
};

/**
 * POST /api/v1/provision/node
 * Sensor node ESP32 tự đăng ký dưới 1 gateway
 * Response trả thêm node_numeric_id để firmware dùng cho SensorPayload.nodeId
 */
const provisionNode = async (req, res) => {
  try {
    const { name, gateway_id, lat, lng } = req.body;

    const node = await deviceService.createNode({
      name,
      gateway_id,
      lat,
      lng,
      status: 'active',
      battery_level: 100,
    });

    // Trích số từ NODE_XXX → numeric ID cho firmware
    const match = node.id.match(/_(\d+)$/);
    const nodeNumericId = match ? parseInt(match[1], 10) : 0;

    res.status(201).json({
      success: true,
      data: {
        ...node,
        node_numeric_id: nodeNumericId,
      },
    });
  } catch (error) {
    if (error.code === 'INVALID_REFERENCE') {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    console.error('[Provision] Lỗi đăng ký node:', error.message);
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi đăng ký sensor node',
    });
  }
};

module.exports = {
  provisionGateway,
  listGateways,
  provisionNode,
};
