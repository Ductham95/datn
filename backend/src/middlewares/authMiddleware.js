const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'airquality-admin-secret-2026';

const verifyAdmin = (req, res, next) => {
  const tokenHeader = req.headers['authorization'];
  if (!tokenHeader) {
    return res.status(401).json({ success: false, error: 'Truy cập bị từ chối. Vui lòng cung cấp token' });
  }

  const token = tokenHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token không hợp lệ' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    if (verified.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Chỉ Admin mới có quyền truy cập' });
    }
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ success: false, error: 'Token đã hết hạn hoặc không hợp lệ' });
  }
};

module.exports = { verifyAdmin, JWT_SECRET };
