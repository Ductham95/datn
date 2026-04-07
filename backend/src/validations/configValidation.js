/**
 * Validation Middleware cho Config API
 * Kiểm tra request body trước khi đến Controller
 */

/**
 * Validate body khi cập nhật config (PUT /admin/config)
 */
const validateConfigBody = (req, res, next) => {
  const {
    pm25_warn, pm25_danger,
    pm10_warn, pm10_danger,
    co2_warn, co2_danger,
    tvoc_warn, tvoc_danger,
    temp_min, temp_max,
    sampling_interval,
  } = req.body;

  const errors = [];

  // --- Helper: validate số dương ---
  const validatePositiveNumber = (value, name) => {
    if (value !== undefined) {
      if (typeof value !== 'number' || value <= 0) {
        errors.push(`${name} phải là số dương`);
        return false;
      }
    }
    return true;
  };

  // --- Helper: validate số nguyên dương ---
  const validatePositiveInt = (value, name) => {
    if (value !== undefined) {
      if (!Number.isInteger(value) || value <= 0) {
        errors.push(`${name} phải là số nguyên dương`);
        return false;
      }
    }
    return true;
  };

  // Validate PM2.5
  validatePositiveNumber(pm25_warn, 'Ngưỡng cảnh báo PM2.5 (pm25_warn)');
  validatePositiveNumber(pm25_danger, 'Ngưỡng nguy hiểm PM2.5 (pm25_danger)');
  if (pm25_warn !== undefined && pm25_danger !== undefined && pm25_warn >= pm25_danger) {
    errors.push('pm25_warn phải nhỏ hơn pm25_danger');
  }

  // Validate PM10
  validatePositiveNumber(pm10_warn, 'Ngưỡng cảnh báo PM10 (pm10_warn)');
  validatePositiveNumber(pm10_danger, 'Ngưỡng nguy hiểm PM10 (pm10_danger)');
  if (pm10_warn !== undefined && pm10_danger !== undefined && pm10_warn >= pm10_danger) {
    errors.push('pm10_warn phải nhỏ hơn pm10_danger');
  }

  // Validate CO2
  validatePositiveInt(co2_warn, 'Ngưỡng cảnh báo CO2 (co2_warn)');
  validatePositiveInt(co2_danger, 'Ngưỡng nguy hiểm CO2 (co2_danger)');
  if (co2_warn !== undefined && co2_danger !== undefined && co2_warn >= co2_danger) {
    errors.push('co2_warn phải nhỏ hơn co2_danger');
  }

  // Validate TVOC
  validatePositiveInt(tvoc_warn, 'Ngưỡng cảnh báo TVOC (tvoc_warn)');
  validatePositiveInt(tvoc_danger, 'Ngưỡng nguy hiểm TVOC (tvoc_danger)');
  if (tvoc_warn !== undefined && tvoc_danger !== undefined && tvoc_warn >= tvoc_danger) {
    errors.push('tvoc_warn phải nhỏ hơn tvoc_danger');
  }

  // Validate nhiệt độ
  if (temp_min !== undefined) {
    if (typeof temp_min !== 'number') {
      errors.push('Nhiệt độ tối thiểu (temp_min) phải là số');
    }
  }
  if (temp_max !== undefined) {
    if (typeof temp_max !== 'number') {
      errors.push('Nhiệt độ tối đa (temp_max) phải là số');
    }
  }
  if (temp_min !== undefined && temp_max !== undefined && temp_min >= temp_max) {
    errors.push('temp_min phải nhỏ hơn temp_max');
  }

  // Validate sampling interval (tối thiểu 60 giây)
  if (sampling_interval !== undefined) {
    if (!Number.isInteger(sampling_interval) || sampling_interval < 60) {
      errors.push('Chu kỳ gửi dữ liệu (sampling_interval) phải là số nguyên >= 60 giây');
    }
  }

  // Phải có ít nhất 1 field
  const allFields = [
    pm25_warn, pm25_danger, pm10_warn, pm10_danger,
    co2_warn, co2_danger, tvoc_warn, tvoc_danger,
    temp_min, temp_max, sampling_interval,
  ];
  if (allFields.every(v => v === undefined)) {
    errors.push('Cần cung cấp ít nhất một trường để cập nhật');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};

module.exports = { validateConfigBody };
