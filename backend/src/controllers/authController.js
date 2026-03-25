const authService = require('../services/authService');

const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, error: 'Nhập đầy đủ tên và mật khẩu' });

  try {
    const result = await authService.checkLogin(username, password);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[Admin Login API]', error);
    if (error.message === 'Tài khoản không tồn tại' || error.message === 'Sai mật khẩu') {
      return res.status(401).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

module.exports = { login };
