const GATEWAY_SECRET = process.env.GATEWAY_SECRET || 'super-secret-key';

/**
 * Middleware kiểm tra Payload và Khóa xác thực từ Gateway gửi lên
 * Đặt trước luồng Ingestion API
 */
const validateGatewayPayload = (req, res, next) => {
  const { gateway_id, secret, data } = req.body;

  // 1. Kiểm tra tồn tại thông số bắt buộc
  if (!gateway_id || !secret) {
    return res.status(401).json({ 
      success: false, 
      error: 'Truy cập từ chối. Lỗi thiếu gateway_id hoặc secret key!' 
    });
  }

  // 2. Chống giả mạo Gateway
  if (secret !== GATEWAY_SECRET) {
    return res.status(401).json({ 
      success: false, 
      error: 'Sai Secret Key. Máy chủ từ chối tiếp nhận gói tin.' 
    });
  }

  // 3. Kiểm tra định dạng dữ liệu viễn thông (data)
  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Payload data rỗng hoặc sai định dạng. Yêu cầu là một Array.' 
    });
  }

  // Nếu mọi thứ vẹn toàn, chuyển tiếp sang Controller tính toán
  next();
};

module.exports = {
  validateGatewayPayload
};
