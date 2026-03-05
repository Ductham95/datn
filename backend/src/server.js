/**
 * =====================================================
 * HỆ THỐNG GIÁM SÁT CHẤT LƯỢNG KHÔNG KHÍ ĐÔ THỊ
 * Backend Server - Entry Point
 * =====================================================
 */

require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { initDatabase } = require('./models/database');
const { initMQTT } = require('./mqtt/subscriber');
const apiRoutes = require('./routes/api');

const PORT = process.env.PORT || 3000;

// ==================== EXPRESS SETUP ====================
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files (sau khi build)
app.use(express.static('../frontend/dist'));

// API Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ==================== SOCKET.IO ====================
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

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

    // 2. Khởi tạo MQTT
    console.log('\n[2/3] Khởi tạo MQTT Subscriber...');
    initMQTT(io);

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
