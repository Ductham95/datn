/**
 * =====================================================
 * HỆ THỐNG GIÁM SÁT CHẤT LƯỢNG KHÔNG KHÍ ĐÔ THỊ
 * Backend Server - Entry Point
 * =====================================================
 */

require('dotenv').config();

// Fix lệch giờ: Buộc quá trình Node.js sử dụng múi giờ Việt Nam
process.env.TZ = 'Asia/Ho_Chi_Minh';

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');
const { initDatabase } = require('./config/db.config');
const apiRoutes = require('./routes/userApi');
const adminRoutes = require('./routes/adminapi');
const gatewayRoutes = require('./routes/gatewayApi');

const PORT = process.env.PORT || 3000;

// ==================== EXPRESS SETUP ====================
const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// ==================== SOCKET.IO ====================
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

// Serve static frontend files (sau khi build)
app.use(express.static('../frontend/dist'));

// API Routes
app.use('/api/v1', apiRoutes);
app.use('/api/v1/telemetry', gatewayRoutes);
app.use('/api/v1/admin', adminRoutes); // Endpoint cho Admin Dashboard

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client kết nối: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client ngắt kết nối: ${socket.id}`);
  });
});

// ==================== START SERVER ====================
async function start() {
  try {
    console.log('========================================');
    console.log('  AIR QUALITY MONITORING - SERVER');
    console.log('========================================');

    // 1. Khởi tạo Database
    console.log('\n[1/3] Khởi tạo Database...');
    await initDatabase();

    // 2.5 Khởi động Background Jobs (Cronjob quét mạng IoT offline)
    const { startBackgroundJobs } = require('./services/cronJobs');
    startBackgroundJobs();

    // 3. Start Express Server
    console.log('\n[3/3] Khởi động HTTP Server...');
    server.listen(PORT, () => {
      console.log(`\n✅ Server đang chạy tại: http://localhost:${PORT}`);
      console.log(`   API:       http://localhost:${PORT}/api`);
      console.log(`   Socket.io: ws://localhost:${PORT}`);
      console.log(`   Health:    http://localhost:${PORT}/health`);
      console.log('\n========================================\n');
    });
  } catch (error) {
    console.error('❌ Lỗi khởi động server:', error);
    process.exit(1);
  }
}

start();
