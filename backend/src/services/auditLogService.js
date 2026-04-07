const prisma = require('../config/prismaClient');

/**
 * Ghi 1 dòng audit log
 * @param {Object} params
 * @param {string} params.userId    - UUID của admin thực hiện
 * @param {string} params.username  - Username admin
 * @param {string} params.action    - 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'CHANGE_PASSWORD'
 * @param {string} params.resource  - 'gateway' | 'node' | 'user' | 'config' | 'alert' | 'auth'
 * @param {string} [params.resourceId] - ID của resource bị tác động
 * @param {string} [params.details] - Mô tả chi tiết (JSON string hoặc text)
 * @param {string} [params.ipAddress] - IP client
 */
const writeLog = async ({ userId, username, action, resource, resourceId, details, ipAddress }) => {
  try {
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        username,
        action,
        resource,
        resource_id: resourceId || null,
        details: details || null,
        ip_address: ipAddress || null,
      },
    });
  } catch (err) {
    // Audit log không được làm fail request chính
    console.error('[AuditLog] Lỗi ghi log:', err.message);
  }
};

/**
 * Lấy danh sách audit logs, hỗ trợ filter + phân trang
 * @param {Object} filters - { username, action, resource, from, to, page, limit }
 */
const getLogs = async (filters = {}) => {
  const {
    username,
    action,
    resource,
    from,
    to,
    page = 1,
    limit = 50,
  } = filters;

  const where = {};

  if (username) where.username = { contains: username, mode: 'insensitive' };
  if (action) where.action = action;
  if (resource) where.resource = resource;

  if (from || to) {
    where.created_at = {};
    if (from) where.created_at.gte = new Date(from);
    if (to) where.created_at.lte = new Date(to);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page: parseInt(page),
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

module.exports = { writeLog, getLogs };
