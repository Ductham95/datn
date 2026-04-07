const prisma = require('../config/prismaClient');
const GATEWAY_SECRET = process.env.GATEWAY_SECRET || 'super-secret-key';

/**
 * Middleware kiểm tra Payload và Khóa xác thực từ Gateway gửi lên
 * Đặt trước luồng Ingestion API
 */
const validateGatewayPayload =  async (req, res, next) => {
  const { gateway_id, secret, data } = req.body;

  // 1. Kiểm tra tồn tại thông số bắt buộc
  if (!gateway_id || !secret || !data) {
    return res.status(401).json({ 
      success: false, 
      error: 'Truy cập từ chối. Lỗi thiếu gateway_id, secret key hoặc data!' 
    });
  }

  // 2. Chống giả mạo Gateway
  if (secret !== GATEWAY_SECRET) {
    return res.status(401).json({ 
      success: false, 
      error: 'Sai Secret Key. Máy chủ từ chối tiếp nhận gói tin.' 
    });
  }

  // 3. Kiểm tra cấu trúc dữ liệu
  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Payload data rỗng hoặc sai định dạng. Yêu cầu là một Array.' 
    });
  }

  // 4. Kiểm tra dữ liệu trong CSDL
  try {
    // 4.1. Kiểm tra gateway
    const gateway = await prisma.gateway.findUnique({ where: { id: gateway_id } });
    if (!gateway) {
      return res.status(404).json({ 
        success: false, 
        error: 'Gateway không tồn tại!' 
      });
    }

    // 4.2. Kiểm tra node_id
    const nodeIds = data.map(item => item.node_id).filter(Boolean);
    if (nodeIds.length > 0) {
      // Lấy danh sách các node hiện có thuộc gateway này
      const existingNodes = await prisma.sensorNode.findMany({
        where: {
          id: { in: nodeIds },
          gateway_id: gateway_id
        },
        select: { id: true }
      });
      
      const existingNodeIds = existingNodes.map(node => node.id);
      const missingNodes = nodeIds.filter(id => !existingNodeIds.includes(id));
      
      if (missingNodes.length > 0) {
        return res.status(404).json({
          success: false,
          error: `Một số Node không tồn tại hoặc không thuộc Gateway này: ${missingNodes.join(', ')}`
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Payload không chứa bất kỳ node_id hợp lệ nào.'
      });
    }

  } catch(error) {
    console.error('[Validation] Lỗi kiểm tra Database:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Lỗi hệ thống khi đối chiếu dữ liệu Gateway/Node_id!' 
    });
  }

  // Nếu mọi thứ vẹn toàn, chuyển tiếp sang Controller tính toán
  next();
};

module.exports = {
  validateGatewayPayload
};
