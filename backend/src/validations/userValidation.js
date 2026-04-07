/**
 * Validation Middleware cho User Management API
 */

const VALID_ROLES = ['admin', 'user'];

/**
 * Validate body khi tạo/sửa User
 * POST: username, password bắt buộc
 * PUT: ít nhất 1 field
 */
const validateUserBody = (req, res, next) => {
  const { username, password, role } = req.body;
  const isCreate = req.method === 'POST';
  const errors = [];

  // POST: username, password bắt buộc
  if (isCreate) {
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      errors.push('Tên đăng nhập (username) là bắt buộc');
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      errors.push('Mật khẩu (password) là bắt buộc và phải có ít nhất 6 ký tự');
    }
  }

  // Validate username nếu có
  if (username !== undefined) {
    if (typeof username !== 'string' || username.trim().length === 0) {
      errors.push('Tên đăng nhập (username) phải là chuỗi không rỗng');
    } else if (username.length < 3) {
      errors.push('Tên đăng nhập (username) phải có ít nhất 3 ký tự');
    } else if (username.length > 100) {
      errors.push('Tên đăng nhập (username) tối đa 100 ký tự');
    }
  }

  // Validate role nếu có
  if (role !== undefined) {
    if (!VALID_ROLES.includes(role)) {
      errors.push(`Quyền (role) phải là một trong: ${VALID_ROLES.join(', ')}`);
    }
  }

  // PUT: phải có ít nhất 1 field
  if (!isCreate) {
    const hasUpdate = [username, role].some(v => v !== undefined);
    if (!hasUpdate) {
      errors.push('Cần cung cấp ít nhất một trường để cập nhật (username, role)');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};

module.exports = { validateUserBody };
