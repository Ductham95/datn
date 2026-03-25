const { Pool } = require('pg');

// Khởi tạo connection pool cho PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'datn_admin',
  password: process.env.DB_PASSWORD || 'datn_password',
  database: process.env.DB_NAME || 'air_quality_db',
  max: 20, // max number of connections in the pool
  idleTimeoutMillis: 30000,
});

// Kiểm tra kết nối database
async function initDatabase() {
  try {
    const client = await pool.connect();
    console.log('[DB] Kết nối PostgreSQL (TimescaleDB) thành công!');
    
    // Ép Database sử dụng Múi giờ Việt Nam vĩnh viễn (Fix lỗi lệch last_seen)
    await client.query(`ALTER DATABASE "${process.env.DB_NAME || 'air_quality_db'}" SET timezone TO 'Asia/Ho_Chi_Minh';`);
    console.log('[DB] Đã thiết lập múi giờ: Asia/Ho_Chi_Minh');

    // (Lưu ý: Không tự động tạo bảng ở đây vì đã dùng init.sql qua Docker)
    
    client.release();
  } catch (err) {
    console.error('[DB] Lỗi kết nối PostgreSQL:', err.message);
    throw err;
  }
}

module.exports = { pool, initDatabase };
