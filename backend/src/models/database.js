const mysql = require('mysql2/promise');

// Tạo connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'airquality',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Khởi tạo database và bảng
async function initDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  // Tạo database nếu chưa có
  await connection.execute(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'airquality'}\``
  );
  await connection.end();

  // Tạo bảng nodes
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS nodes (
      id INT PRIMARY KEY,
      name VARCHAR(100) NOT NULL DEFAULT '',
      latitude DOUBLE DEFAULT 0,
      longitude DOUBLE DEFAULT 0,
      location_name VARCHAR(255) DEFAULT '',
      status ENUM('online', 'offline', 'warning') DEFAULT 'offline',
      last_seen DATETIME DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tạo bảng measurements
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS measurements (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      node_id INT NOT NULL,
      pm25 FLOAT DEFAULT 0,
      pm10 FLOAT DEFAULT 0,
      co2 INT DEFAULT 0,
      tvoc INT DEFAULT 0,
      temperature FLOAT DEFAULT 0,
      humidity FLOAT DEFAULT 0,
      battery INT DEFAULT 0,
      rssi INT DEFAULT 0,
      snr FLOAT DEFAULT 0,
      aqi INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_node_time (node_id, created_at),
      FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
    )
  `);

  // Tạo bảng alerts
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS alerts (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      node_id INT NOT NULL,
      alert_type ENUM('aqi', 'co2', 'tvoc', 'battery', 'offline') NOT NULL,
      level ENUM('warning', 'danger', 'critical') NOT NULL,
      message TEXT,
      value FLOAT,
      threshold FLOAT,
      acknowledged BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
    )
  `);

  // Chèn dữ liệu mẫu cho 3 node (nếu chưa có)
  await pool.execute(`
    INSERT IGNORE INTO nodes (id, name, latitude, longitude, location_name) VALUES
    (1, 'Node 01 - Trung tâm', 10.7769, 106.7009, 'Quận 1, TP.HCM'),
    (2, 'Node 02 - Công nghiệp', 10.8231, 106.6297, 'Quận Tân Phú, TP.HCM'),
    (3, 'Node 03 - Ngoại ô', 10.8506, 106.7718, 'Quận 9, TP.HCM')
  `);

  console.log('[DB] Database và bảng đã được khởi tạo thành công');
}

module.exports = { pool, initDatabase };
