const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prismaClient');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

const checkLogin = async (username, password) => {
  const user = await prisma.user.findUnique({ where: { username } });
  
  if (!user) {
    throw new Error('Tài khoản không tồn tại');
  }

  let isMatch = false;

  if (user.password_hash === password) {
      isMatch = true;
  } else {
      isMatch = await bcrypt.compare(password, user.password_hash);
  }

  if (!isMatch) {
    throw new Error('Sai mật khẩu');
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role }, 
    JWT_SECRET, 
    { expiresIn: '24h' }
  );

  return { token, user: { username: user.username, role: user.role } };
};

module.exports = { checkLogin };
