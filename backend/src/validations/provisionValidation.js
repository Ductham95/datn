/**
 * Validation Middleware cho Provisioning API
 * Thiết bị tự đăng ký, xác thực bằng provision_key thay vì JWT
 */

const PROVISION_KEY = process.env.PROVISION_KEY || 'airquality2026';

/**
 * Xác thực provision_key
 * Kiểm tra trong body (POST) hoặc query (GET)
 */
const verifyProvisionKey = (req, res, next) => {
  const key = req.body?.provision_key || req.query?.provision_key;

  if (!key) {
    return res.status(401).json({
      success: false,
      error: 'Thiếu mã xác thực (provision_key)',
    });
  }

  if (key !== PROVISION_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Mã xác thực không hợp lệ',
    });
  }

  next();
};

/**
 * Validate body khi gateway tự đăng ký
 * POST /api/v1/provision/gateway
 */
const validateProvisionGateway = (req, res, next) => {
  const { name, location_desc } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Tên gateway (name) là bắt buộc');
  } else if (name.length > 100) {
    errors.push('Tên gateway (name) tối đa 100 ký tự');
  }

  if (location_desc !== undefined) {
    if (typeof location_desc !== 'string') {
      errors.push('Mô tả vị trí (location_desc) phải là chuỗi');
    } else if (location_desc.length > 255) {
      errors.push('Mô tả vị trí (location_desc) tối đa 255 ký tự');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};

/**
 * Validate body khi sensor node tự đăng ký
 * POST /api/v1/provision/node
 */
const validateProvisionNode = (req, res, next) => {
  const { name, gateway_id, lat, lng } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Tên node (name) là bắt buộc');
  } else if (name.length > 100) {
    errors.push('Tên node (name) tối đa 100 ký tự');
  }

  // Validate gateway_id nếu có (optional)
  if (gateway_id !== undefined && gateway_id !== null) {
    if (typeof gateway_id !== 'string' || gateway_id.trim().length === 0) {
      errors.push('Gateway ID (gateway_id) phải là chuỗi không rỗng');
    }
  }

  // Validate tọa độ nếu có
  if (lat !== undefined || lng !== undefined) {
    if (lat === undefined || lng === undefined) {
      errors.push('Phải cung cấp cả lat và lng');
    } else {
      if (typeof lat !== 'number' || lat < -90 || lat > 90) {
        errors.push('Vĩ độ (lat) phải là số trong khoảng -90 đến 90');
      }
      if (typeof lng !== 'number' || lng < -180 || lng > 180) {
        errors.push('Kinh độ (lng) phải là số trong khoảng -180 đến 180');
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};

module.exports = {
  verifyProvisionKey,
  validateProvisionGateway,
  validateProvisionNode,
};
