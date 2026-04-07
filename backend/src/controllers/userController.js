const userService = require('../services/userService');

/**
 * GET /api/v1/admin/users
 */
const getUsers = async (req, res) => {
  try {
    const data = await userService.getAllUsers();
    res.json({ success: true, data });
  } catch (error) {
    console.error('[Admin] Lỗi lấy danh sách users:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống' });
  }
};

/**
 * POST /api/v1/admin/users
 */
const createUser = async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const data = await userService.createUser({ username, password, role });
    console.log(`[Admin] Đã tạo user: ${data.username} (${data.role})`);
    res.status(201).json({ success: true, data });
  } catch (error) {
    if (error.code === 'DUPLICATE') {
      return res.status(409).json({ success: false, error: error.message });
    }
    console.error('[Admin] Lỗi tạo user:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi tạo user' });
  }
};

/**
 * PUT /api/v1/admin/users/:id
 */
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, role } = req.body;

  try {
    const data = await userService.updateUser(id, { username, role });
    console.log(`[Admin] Đã cập nhật user: ${id}`);
    res.json({ success: true, data });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (error.code === 'DUPLICATE') {
      return res.status(409).json({ success: false, error: error.message });
    }
    if (error.code === 'LAST_ADMIN') {
      return res.status(403).json({ success: false, error: error.message });
    }
    console.error('[Admin] Lỗi cập nhật user:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi cập nhật user' });
  }
};

/**
 * DELETE /api/v1/admin/users/:id
 */
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const data = await userService.deleteUser(id);
    console.log(`[Admin] Đã xóa user: ${data.username}`);
    res.json({ success: true, message: `Đã xóa user "${data.username}" thành công`, data });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (error.code === 'LAST_ADMIN') {
      return res.status(403).json({ success: false, error: error.message });
    }
    console.error('[Admin] Lỗi xóa user:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi xóa user' });
  }
};

/**
 * PUT /api/v1/admin/users/change-password
 * Dùng req.user.id từ JWT token
 */
const changePassword = async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Vui lòng cung cấp mật khẩu cũ và mật khẩu mới' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
  }

  try {
    const result = await userService.changePassword(userId, { oldPassword, newPassword });
    console.log(`[Admin] User ${req.user.username} đã đổi mật khẩu`);
    res.json({ success: true, ...result });
  } catch (error) {
    if (error.code === 'WRONG_PASSWORD') {
      return res.status(401).json({ success: false, error: error.message });
    }
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: error.message });
    }
    console.error('[Admin] Lỗi đổi mật khẩu:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống' });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser, changePassword };
