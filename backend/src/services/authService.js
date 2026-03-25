const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db.config');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

const checkLogin = async (username, password) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  if (rows.length === 0) {
    throw new Error('Tài khoản không tồn tại');
  }
  
  const user = rows[0];
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
