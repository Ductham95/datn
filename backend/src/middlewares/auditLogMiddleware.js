const { writeLog } = require('../services/auditLogService');

/**
 * Middleware tự động ghi audit log cho mọi thao tác admin (trừ GET).
 * Ghi log SAU KHI response đã được gửi (dùng res.on('finish')).
 *
 * Resource mapping dựa vào URL:
 *   /admin/gateways/*  → 'gateway'
 *   /admin/nodes/*     → 'node'
 *   /admin/users/*     → 'user'
 *   /admin/config      → 'config'
 *   /admin/alerts/*    → 'alert'
 *   /admin/login       → 'auth'
 */
const auditLogger = (req, res, next) => {
  // Chỉ log các thao tác thay đổi dữ liệu
  if (req.method === 'GET') return next();

  // Lưu body gốc trước khi xử lý (cho details)
  const originalBody = { ...req.body };

  // Ghi log sau khi response hoàn thành
  res.on('finish', () => {
    // Chỉ log nếu request thành công (2xx)
    if (res.statusCode < 200 || res.statusCode >= 300) return;

    // Xác định resource từ URL
    const resource = detectResource(req.originalUrl);
    if (!resource) return;

    // Xác định action từ HTTP method
    const action = detectAction(req.method, req.originalUrl);

    // Xác định resource ID (nếu có)
    const resourceId = extractResourceId(req.originalUrl, req.params);

    // Tạo details (ẩn password)
    const details = sanitizeDetails(originalBody, resource, action);

    // Lấy thông tin user từ JWT (req.user được set bởi verifyAdmin)
    const user = req.user;
    if (!user) return;

    // Lấy IP
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;

    writeLog({
      userId: user.id,
      username: user.username,
      action,
      resource,
      resourceId,
      details: details ? JSON.stringify(details) : null,
      ipAddress,
    });
  });

  next();
};

/**
 * Xác định resource từ URL
 */
function detectResource(url) {
  if (url.includes('/admin/gateways')) return 'gateway';
  if (url.includes('/admin/nodes')) return 'node';
  if (url.includes('/admin/users')) return 'user';
  if (url.includes('/admin/config')) return 'config';
  if (url.includes('/admin/alerts')) return 'alert';
  if (url.includes('/admin/login')) return 'auth';
  return null;
}

/**
 * Xác định action từ HTTP method + URL
 */
function detectAction(method, url) {
  if (url.includes('/login')) return 'LOGIN';
  if (url.includes('/change-password')) return 'CHANGE_PASSWORD';
  if (url.includes('/ack')) return 'UPDATE';

  switch (method) {
    case 'POST': return 'CREATE';
    case 'PUT': return 'UPDATE';
    case 'PATCH': return 'UPDATE';
    case 'DELETE': return 'DELETE';
    default: return method;
  }
}

/**
 * Trích resource ID từ URL params
 */
function extractResourceId(url, params) {
  return params?.id || null;
}

/**
 * Ẩn thông tin nhạy cảm (password) trong details
 */
function sanitizeDetails(body, resource, action) {
  if (!body || Object.keys(body).length === 0) return null;

  const sanitized = { ...body };

  // Ẩn password
  if (sanitized.password) sanitized.password = '***';
  if (sanitized.oldPassword) sanitized.oldPassword = '***';
  if (sanitized.newPassword) sanitized.newPassword = '***';
  if (sanitized.secret) sanitized.secret = '***';

  return sanitized;
}

module.exports = { auditLogger };
