/**
 * Validation Middleware cho Admin CRUD API
 * Kiểm tra request body trước khi đến Controller
 */

const GATEWAY_STATUSES = ['online', 'offline'];
const NODE_STATUSES = ['active', 'inactive', 'maintenance'];

/**
 * Validate body khi tạo/sửa Gateway
 * POST: name bắt buộc
 * PUT: ít nhất 1 field cần cập nhật
 */
const validateGatewayBody = (req, res, next) => {
  const { name, location_desc, status } = req.body;
  const isCreate = req.method === 'POST';
  const errors = [];

  // POST: name bắt buộc
  if (isCreate) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('Tên gateway (name) là bắt buộc');
    }
  }

  // Validate name nếu có
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      errors.push('Tên gateway (name) phải là chuỗi không rỗng');
    } else if (name.length > 100) {
      errors.push('Tên gateway (name) tối đa 100 ký tự');
    }
  }

  // Validate location_desc nếu có
  if (location_desc !== undefined) {
    if (typeof location_desc !== 'string') {
      errors.push('Mô tả vị trí (location_desc) phải là chuỗi');
    } else if (location_desc.length > 255) {
      errors.push('Mô tả vị trí (location_desc) tối đa 255 ký tự');
    }
  }

  // Validate status nếu có
  if (status !== undefined) {
    if (!GATEWAY_STATUSES.includes(status)) {
      errors.push(`Trạng thái (status) phải là một trong: ${GATEWAY_STATUSES.join(', ')}`);
    }
  }

  // PUT: phải có ít nhất 1 field
  if (!isCreate) {
    const hasUpdate = [name, location_desc, status].some(v => v !== undefined);
    if (!hasUpdate) {
      errors.push('Cần cung cấp ít nhất một trường để cập nhật (name, location_desc, status)');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};

/**
 * Validate body khi tạo/sửa Sensor Node
 * POST: name bắt buộc, gateway_id optional
 * PUT: ít nhất 1 field cần cập nhật
 */
const validateNodeBody = (req, res, next) => {
  const { name, gateway_id, lat, lng, status, battery_level } = req.body;
  const isCreate = req.method === 'POST';
  const errors = [];

  // POST: name bắt buộc, gateway_id optional
  if (isCreate) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('Tên node (name) là bắt buộc');
    }
  }

  // Validate name nếu có
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      errors.push('Tên node (name) phải là chuỗi không rỗng');
    } else if (name.length > 100) {
      errors.push('Tên node (name) tối đa 100 ký tự');
    }
  }

  // Validate gateway_id nếu có
  if (gateway_id !== undefined) {
    if (typeof gateway_id !== 'string' || gateway_id.trim().length === 0) {
      errors.push('Gateway ID (gateway_id) phải là chuỗi không rỗng');
    }
  }

  // Validate tọa độ: phải cung cấp cả cặp lat + lng
  if (lat !== undefined || lng !== undefined) {
    if (lat === undefined || lng === undefined) {
      errors.push('Phải cung cấp cả lat và lng (tọa độ đầy đủ)');
    } else {
      if (typeof lat !== 'number' || lat < -90 || lat > 90) {
        errors.push('Vĩ độ (lat) phải là số trong khoảng -90 đến 90');
      }
      if (typeof lng !== 'number' || lng < -180 || lng > 180) {
        errors.push('Kinh độ (lng) phải là số trong khoảng -180 đến 180');
      }
    }
  }

  // Validate status nếu có
  if (status !== undefined) {
    if (!NODE_STATUSES.includes(status)) {
      errors.push(`Trạng thái (status) phải là một trong: ${NODE_STATUSES.join(', ')}`);
    }
  }

  // Validate battery_level nếu có
  if (battery_level !== undefined) {
    if (!Number.isInteger(battery_level) || battery_level < 0 || battery_level > 100) {
      errors.push('Mức pin (battery_level) phải là số nguyên từ 0 đến 100');
    }
  }

  // PUT: phải có ít nhất 1 field
  if (!isCreate) {
    const hasUpdate = [name, gateway_id, lat, lng, status, battery_level].some(v => v !== undefined);
    if (!hasUpdate) {
      errors.push('Cần cung cấp ít nhất một trường để cập nhật');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};

module.exports = { validateGatewayBody, validateNodeBody };
