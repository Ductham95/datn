const prisma = require('../config/prismaClient');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;
const VALID_ROLES = ['admin', 'user'];

// ==================== READ ====================

/**
 * Lấy danh sách tất cả users (ẩn password_hash)
 */
const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      created_at: true,
    },
    orderBy: { created_at: 'asc' },
  });

  return users;
};

// ==================== CREATE ====================

/**
 * Tạo user mới, hash password bằng bcrypt
 */
const createUser = async ({ username, password, role }) => {
  // Kiểm tra trùng username
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    const error = new Error(`Username "${username}" đã tồn tại`);
    error.code = 'DUPLICATE';
    throw error;
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      username: username.trim(),
      password_hash,
      role: role || 'user',
    },
    select: {
      id: true,
      username: true,
      role: true,
      created_at: true,
    },
  });

  return user;
};

// ==================== UPDATE ====================

/**
 * Cập nhật thông tin user (username, role)
 * Không cho phép đổi password qua endpoint này
 */
const updateUser = async (id, data) => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error('User không tồn tại');
    error.code = 'NOT_FOUND';
    throw error;
  }

  const updateData = {};

  // Kiểm tra trùng username nếu đổi
  if (data.username !== undefined) {
    const duplicate = await prisma.user.findFirst({
      where: { username: data.username.trim(), NOT: { id } },
    });
    if (duplicate) {
      const error = new Error(`Username "${data.username}" đã tồn tại`);
      error.code = 'DUPLICATE';
      throw error;
    }
    updateData.username = data.username.trim();
  }

  if (data.role !== undefined) {
    // Chặn hạ quyền admin cuối cùng
    if (existing.role === 'admin' && data.role !== 'admin') {
      const adminCount = await prisma.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        const error = new Error('Không thể hạ quyền admin cuối cùng. Hệ thống phải có ít nhất 1 admin.');
        error.code = 'LAST_ADMIN';
        throw error;
      }
    }
    updateData.role = data.role;
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      username: true,
      role: true,
      created_at: true,
    },
  });
};

// ==================== DELETE ====================

/**
 * Xóa user. Chặn xóa admin cuối cùng.
 */
const deleteUser = async (id) => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error('User không tồn tại');
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Chặn xóa admin cuối cùng
  if (existing.role === 'admin') {
    const adminCount = await prisma.user.count({ where: { role: 'admin' } });
    if (adminCount <= 1) {
      const error = new Error('Không thể xóa admin cuối cùng. Hệ thống phải có ít nhất 1 admin.');
      error.code = 'LAST_ADMIN';
      throw error;
    }
  }

  await prisma.user.delete({ where: { id } });
  return { id, username: existing.username };
};

// ==================== CHANGE PASSWORD ====================

/**
 * Đổi mật khẩu (verify mật khẩu cũ trước)
 */
const changePassword = async (userId, { oldPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const error = new Error('User không tồn tại');
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Verify mật khẩu cũ (hỗ trợ cả plaintext legacy và bcrypt)
  let isMatch = false;
  if (user.password_hash === oldPassword) {
    isMatch = true;
  } else {
    isMatch = await bcrypt.compare(oldPassword, user.password_hash);
  }

  if (!isMatch) {
    const error = new Error('Mật khẩu cũ không đúng');
    error.code = 'WRONG_PASSWORD';
    throw error;
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { password_hash: newHash },
  });

  return { message: 'Đổi mật khẩu thành công' };
};

module.exports = { getAllUsers, createUser, updateUser, deleteUser, changePassword };
