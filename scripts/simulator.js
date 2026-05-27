#!/usr/bin/env node
/**
 * =====================================================
 * SENSOR NODE SIMULATOR
 * Giả lập nhiều sensor node, sinh dữ liệu lịch sử & realtime
 * =====================================================
 *
 * Cách dùng:
 *   # Backfill 7 ngày (ghi trực tiếp vào DB)
 *   node scripts/simulator.js
 *
 *   # Backfill với thời gian tùy chỉnh
 *   node scripts/simulator.js --from "2026-05-20" --to "2026-05-27" --interval 5
 *
 *   # Realtime (POST đến API mỗi 10 giây)
 *   node scripts/simulator.js --realtime --interval 10
 *
 *   # Chỉ tạo node (provision) mà không sinh data
 *   node scripts/simulator.js --provision-only
 */

// Resolve modules từ backend/node_modules (không cần npm install riêng)
const path = require('path');
const BACKEND_DIR = path.join(__dirname, '..', 'backend');
module.paths.unshift(path.join(BACKEND_DIR, 'node_modules'));

// Load .env từ thư mục backend
require('dotenv').config({ path: path.join(BACKEND_DIR, '.env') });

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// ==================== CẤU HÌNH ====================

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const PROVISION_KEY = process.env.PROVISION_KEY || 'airquality2026';
const GATEWAY_SECRET = process.env.GATEWAY_SECRET || 'super-secret-key';

/**
 * Danh sách sensor node giả lập — chỉnh sửa tại đây
 * gateway_id phải tồn tại trong DB (hoặc để null)
 */
const SIMULATED_NODES = [
  // === Tây Bắc ===
  { name: 'Sensor Điện Biên',   gateway_id: 'GW_001', lat: 21.3860, lng: 103.0230 },
  { name: 'Sensor Sơn La',      gateway_id: 'GW_001', lat: 21.3256, lng: 103.9188 },
  { name: 'Sensor Lai Châu',    gateway_id: 'GW_001', lat: 22.3964, lng: 103.4583 },
  { name: 'Sensor Lào Cai',     gateway_id: 'GW_001', lat: 22.4856, lng: 103.9707 },
  // === Đông Bắc ===
  { name: 'Sensor Hà Giang',    gateway_id: 'GW_001', lat: 22.8233, lng: 104.9838 },
  { name: 'Sensor Cao Bằng',    gateway_id: 'GW_001', lat: 22.6666, lng: 106.2522 },
  { name: 'Sensor Lạng Sơn',    gateway_id: 'GW_001', lat: 21.8460, lng: 106.7570 },
  { name: 'Sensor Thái Nguyên', gateway_id: 'GW_001', lat: 21.5928, lng: 105.8442 },
  // === Đồng bằng Bắc Bộ ===
  // Hà Nội mở rộng
  { name: 'Sensor Hà Nội',       gateway_id: 'GW_001', lat: 21.0285, lng: 105.8542 },
  { name: 'Sensor Đông Anh',     gateway_id: 'GW_001', lat: 21.1394, lng: 105.8468 },
  { name: 'Sensor Hà Đông',      gateway_id: 'GW_001', lat: 20.9720, lng: 105.7780 },
  { name: 'Sensor Gia Lâm',      gateway_id: 'GW_001', lat: 21.0133, lng: 105.9369 },
  { name: 'Sensor Sơn Tây',      gateway_id: 'GW_001', lat: 21.1381, lng: 105.5047 },
  { name: 'Sensor Mê Linh',      gateway_id: 'GW_001', lat: 21.1882, lng: 105.7248 },
  { name: 'Sensor Thạch Thất',   gateway_id: 'GW_001', lat: 21.0157, lng: 105.5556 },
  { name: 'Sensor Thanh Trì',    gateway_id: 'GW_001', lat: 20.9442, lng: 105.8614 },
  // Bắc Ninh — Bắc Giang
  { name: 'Sensor Bắc Ninh',     gateway_id: 'GW_001', lat: 21.1861, lng: 106.0763 },
  { name: 'Sensor Từ Sơn',       gateway_id: 'GW_001', lat: 21.1197, lng: 105.9681 },
  { name: 'Sensor Bắc Giang',    gateway_id: 'GW_001', lat: 21.2731, lng: 106.1946 },
  // Hải Dương — Hải Phòng — Quảng Ninh
  { name: 'Sensor Hải Dương',    gateway_id: 'GW_001', lat: 20.9373, lng: 106.3146 },
  { name: 'Sensor Chí Linh',     gateway_id: 'GW_001', lat: 21.1300, lng: 106.3932 },
  { name: 'Sensor Hải Phòng',    gateway_id: 'GW_001', lat: 20.8449, lng: 106.6881 },
  { name: 'Sensor Đồ Sơn',      gateway_id: 'GW_001', lat: 20.7137, lng: 106.7836 },
  { name: 'Sensor Hạ Long',      gateway_id: 'GW_001', lat: 20.9511, lng: 107.0748 },
  { name: 'Sensor Cẩm Phả',     gateway_id: 'GW_001', lat: 21.0131, lng: 107.3132 },
  { name: 'Sensor Móng Cái',     gateway_id: 'GW_001', lat: 21.5225, lng: 107.9650 },
  { name: 'Sensor Uông Bí',      gateway_id: 'GW_001', lat: 21.0356, lng: 106.7825 },
  // Vĩnh Phúc — Phú Thọ — Hòa Bình
  { name: 'Sensor Vĩnh Phúc',    gateway_id: 'GW_001', lat: 21.3089, lng: 105.6047 },
  { name: 'Sensor Phú Thọ',      gateway_id: 'GW_001', lat: 21.4220, lng: 105.2297 },
  { name: 'Sensor Việt Trì',     gateway_id: 'GW_001', lat: 21.3227, lng: 105.4019 },
  { name: 'Sensor Hòa Bình',     gateway_id: 'GW_001', lat: 20.8171, lng: 105.3384 },
  // Hưng Yên — Hà Nam — Thái Bình — Nam Định — Ninh Bình
  { name: 'Sensor Hưng Yên',     gateway_id: 'GW_001', lat: 20.6464, lng: 106.0511 },
  { name: 'Sensor Hà Nam',       gateway_id: 'GW_001', lat: 20.5835, lng: 105.9230 },
  { name: 'Sensor Thái Bình',    gateway_id: 'GW_001', lat: 20.4463, lng: 106.3365 },
  { name: 'Sensor Tiền Hải',     gateway_id: 'GW_001', lat: 20.3264, lng: 106.5540 },
  { name: 'Sensor Nam Định',     gateway_id: 'GW_001', lat: 20.4388, lng: 106.1621 },
  { name: 'Sensor Ninh Bình',    gateway_id: 'GW_001', lat: 20.2506, lng: 105.9745 },
  { name: 'Sensor Tam Điệp',     gateway_id: 'GW_001', lat: 20.1513, lng: 105.9024 },
  { name: 'Sensor Tam Cốc',      gateway_id: 'GW_001', lat: 20.2150, lng: 105.9380 },
  // === Bắc Trung Bộ ===
  { name: 'Sensor Thanh Hóa',   gateway_id: 'GW_001', lat: 19.8067, lng: 105.7852 },
  { name: 'Sensor Vinh',        gateway_id: 'GW_001', lat: 18.6790, lng: 105.6813 },
  { name: 'Sensor Đồng Hới',    gateway_id: 'GW_001', lat: 17.4690, lng: 106.6003 },
  { name: 'Sensor Huế',         gateway_id: 'GW_001', lat: 16.4637, lng: 107.5909 },
  // === Nam Trung Bộ ===
  { name: 'Sensor Đà Nẵng',     gateway_id: 'GW_001', lat: 16.0544, lng: 108.2022 },
  { name: 'Sensor Quảng Ngãi',  gateway_id: 'GW_001', lat: 15.1214, lng: 108.8044 },
  { name: 'Sensor Quy Nhơn',    gateway_id: 'GW_001', lat: 13.7830, lng: 109.2197 },
  { name: 'Sensor Nha Trang',   gateway_id: 'GW_001', lat: 12.2388, lng: 109.1967 },
  { name: 'Sensor Phan Thiết',  gateway_id: 'GW_001', lat: 10.9330, lng: 108.1001 },
  // === Tây Nguyên ===
  { name: 'Sensor Kon Tum',     gateway_id: 'GW_001', lat: 14.3497, lng: 108.0005 },
  { name: 'Sensor Pleiku',      gateway_id: 'GW_001', lat: 13.9833, lng: 108.0000 },
  { name: 'Sensor Buôn Ma Thuột', gateway_id: 'GW_001', lat: 12.6680, lng: 108.0378 },
  { name: 'Sensor Đà Lạt',      gateway_id: 'GW_001', lat: 11.9404, lng: 108.4583 },
  // === Đông Nam Bộ ===
  { name: 'Sensor TP.HCM',      gateway_id: 'GW_001', lat: 10.8231, lng: 106.6297 },
  { name: 'Sensor Biên Hòa',    gateway_id: 'GW_001', lat: 10.9453, lng: 106.8243 },
  { name: 'Sensor Vũng Tàu',    gateway_id: 'GW_001', lat: 10.3460, lng: 107.0843 },
  // === Tây Nam Bộ ===
  { name: 'Sensor Cần Thơ',     gateway_id: 'GW_001', lat: 10.0452, lng: 105.7469 },
  { name: 'Sensor Rạch Giá',    gateway_id: 'GW_001', lat: 10.0125, lng: 105.0809 },
  { name: 'Sensor Cà Mau',      gateway_id: 'GW_001', lat:  9.1769, lng: 105.1524 },
];

// ==================== PARSE CLI ARGS ====================

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
};
const hasFlag = (name) => args.includes(`--${name}`);

const IS_REALTIME = hasFlag('realtime');
const PROVISION_ONLY = hasFlag('provision-only');
const INTERVAL_MINUTES = parseInt(getArg('interval') || (IS_REALTIME ? '10' : '5'), 10);

// Backfill: mặc định 7 ngày trước → bây giờ
const now = new Date();
const defaultFrom = new Date(now);
defaultFrom.setDate(defaultFrom.getDate() - 7);
const BACKFILL_FROM = getArg('from') ? new Date(getArg('from')) : defaultFrom;
const BACKFILL_TO = getArg('to') ? new Date(getArg('to')) : now;

// ==================== PRISMA CLIENT ====================

let prisma;
function getPrisma() {
  if (!prisma) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

// ==================== DATA GENERATION ====================

/**
 * Sinh dữ liệu sensor realistic với biến thiên theo giờ trong ngày:
 * - 6-8h sáng: ô nhiễm tăng (rush hour sáng)
 * - 11-13h: ô nhiễm giảm
 * - 17-19h: ô nhiễm cao nhất (rush hour chiều)
 * - 22-5h: ô nhiễm thấp nhất (đêm)
 */
function generateMeasurement(timestamp) {
  const hour = timestamp.getHours();

  // Hệ số ô nhiễm theo giờ (0.3 = thấp, 1.0 = cao)
  let pollutionFactor;
  if (hour >= 6 && hour < 9) pollutionFactor = 0.7;       // rush sáng
  else if (hour >= 9 && hour < 11) pollutionFactor = 0.5;
  else if (hour >= 11 && hour < 14) pollutionFactor = 0.4; // trưa
  else if (hour >= 14 && hour < 17) pollutionFactor = 0.5;
  else if (hour >= 17 && hour < 20) pollutionFactor = 0.9; // rush chiều
  else if (hour >= 20 && hour < 23) pollutionFactor = 0.6;
  else pollutionFactor = 0.3;                               // đêm

  // Random noise ±20%
  const noise = () => 0.8 + Math.random() * 0.4;

  return {
    pm25: +(5 + 70 * pollutionFactor * noise()).toFixed(1),
    pm10: +(10 + 100 * pollutionFactor * noise()).toFixed(1),
    co2:  Math.round(400 + 800 * pollutionFactor * noise()),
    tvoc: Math.round(50 * pollutionFactor * noise()),
    temperature: +(24 + 8 * Math.sin((hour - 6) * Math.PI / 12) + (Math.random() - 0.5) * 2).toFixed(1),
    humidity: +(65 - 20 * Math.sin((hour - 6) * Math.PI / 12) + (Math.random() - 0.5) * 5).toFixed(1),
  };
}

// ==================== PROVISION NODES ====================

/**
 * Tạo sensor node qua Provision API (nếu chưa tồn tại)
 * Trả về danh sách node_id đã tạo/đã có
 */
async function provisionNodes() {
  const db = getPrisma();
  const nodeIds = [];

  for (const nodeCfg of SIMULATED_NODES) {
    // Kiểm tra node đã tồn tại chưa (theo tên)
    const existing = await db.sensorNode.findFirst({
      where: { name: nodeCfg.name },
      select: { id: true, name: true },
    });

    if (existing) {
      console.log(`  ✓ Node "${existing.name}" đã tồn tại (${existing.id})`);
      nodeIds.push(existing.id);
      continue;
    }

    // Tạo mới qua HTTP API
    try {
      const resp = await fetch(`${BACKEND_URL}/api/v1/provision/node`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...nodeCfg, provision_key: PROVISION_KEY }),
      });
      const result = await resp.json();

      if (result.success) {
        console.log(`  ✓ Tạo node "${nodeCfg.name}" → ${result.data.id}`);
        nodeIds.push(result.data.id);
      } else {
        console.error(`  ✗ Lỗi tạo "${nodeCfg.name}":`, result.error || result.errors);
      }
    } catch (err) {
      console.error(`  ✗ Không kết nối được API để tạo "${nodeCfg.name}":`, err.message);
      console.log('    → Thử tạo trực tiếp vào DB...');

      // Fallback: tạo trực tiếp qua Prisma
      const id = await generateNodeId(db);
      await db.sensorNode.create({
        data: {
          id,
          name: nodeCfg.name.trim(),
          gateway_id: nodeCfg.gateway_id || null,
          status: 'active',
          battery_level: 100,
        },
      });
      if (nodeCfg.lat != null && nodeCfg.lng != null) {
        await db.$executeRawUnsafe(
          `UPDATE sensor_nodes SET geom = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
          nodeCfg.lng, nodeCfg.lat, id
        );
      }
      console.log(`  ✓ Tạo node "${nodeCfg.name}" trực tiếp → ${id}`);
      nodeIds.push(id);
    }
  }

  return nodeIds;
}

async function generateNodeId(db) {
  const items = await db.sensorNode.findMany({
    select: { id: true },
    orderBy: { id: 'desc' },
    take: 1,
  });
  let nextNum = 1;
  if (items.length > 0) {
    const match = items[0].id.match(/_(\d+)$/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  return `NODE_${String(nextNum).padStart(3, '0')}`;
}

// ==================== BACKFILL MODE ====================

async function runBackfill(nodeIds) {
  const db = getPrisma();

  const totalMinutes = (BACKFILL_TO - BACKFILL_FROM) / 60000;
  const totalRecords = Math.floor(totalMinutes / INTERVAL_MINUTES) * nodeIds.length;

  console.log(`\n📊 Backfill: ${BACKFILL_FROM.toISOString()} → ${BACKFILL_TO.toISOString()}`);
  console.log(`   Interval: ${INTERVAL_MINUTES} phút | Nodes: ${nodeIds.length} | Tổng: ~${totalRecords} bản ghi`);

  let created = 0;
  const BATCH_SIZE = 500;
  let batch = [];

  const flushBatch = async () => {
    if (batch.length === 0) return;
    await db.measurement.createMany({ data: batch, skipDuplicates: true });
    created += batch.length;
    process.stdout.write(`\r   Đã ghi: ${created}/${totalRecords} (${((created / totalRecords) * 100).toFixed(1)}%)`);
    batch = [];
  };

  let cursor = new Date(BACKFILL_FROM);
  while (cursor <= BACKFILL_TO) {
    for (const nodeId of nodeIds) {
      const measurement = generateMeasurement(cursor);
      batch.push({
        time: new Date(cursor),
        node_id: nodeId,
        ...measurement,
      });

      if (batch.length >= BATCH_SIZE) {
        await flushBatch();
      }
    }
    cursor = new Date(cursor.getTime() + INTERVAL_MINUTES * 60000);
  }

  await flushBatch();
  console.log(`\n   ✅ Hoàn tất! Đã ghi ${created} bản ghi.`);
}

// ==================== REALTIME MODE ====================

async function runRealtime(nodeIds) {
  console.log(`\n🔴 Realtime mode: gửi data mỗi ${INTERVAL_MINUTES} giây`);
  console.log('   Nhấn Ctrl+C để dừng.\n');

  // Xác định gateway_id từ node đầu tiên
  const db = getPrisma();
  const firstNode = await db.sensorNode.findUnique({
    where: { id: nodeIds[0] },
    select: { gateway_id: true },
  });
  const gatewayId = firstNode?.gateway_id || 'GW_001';

  const sendData = async () => {
    const timestamp = new Date();
    const data = nodeIds.map(nodeId => ({
      node_id: nodeId,
      ...generateMeasurement(timestamp),
      battery: 80 + Math.floor(Math.random() * 20),
      rssi: -40 - Math.floor(Math.random() * 40),
    }));

    try {
      const resp = await fetch(`${BACKEND_URL}/api/v1/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateway_id: gatewayId, secret: GATEWAY_SECRET, data }),
      });
      const result = await resp.json();
      const timeStr = timestamp.toLocaleTimeString('vi-VN');

      if (result.success) {
        console.log(`  [${timeStr}] ✓ Gửi ${data.length} bản ghi (PM2.5: ${data.map(d => d.pm25).join(', ')})`);
      } else {
        console.log(`  [${timeStr}] ✗ Lỗi:`, result.error);
      }
    } catch (err) {
      console.error(`  ✗ Không kết nối được API:`, err.message);
    }
  };

  // Gửi ngay lần đầu
  await sendData();
  // Lặp lại
  setInterval(sendData, INTERVAL_MINUTES * 1000);
}

// ==================== MAIN ====================

async function main() {
  console.log('========================================');
  console.log('  SENSOR NODE SIMULATOR');
  console.log('========================================\n');

  // 1. Provision nodes
  console.log('📡 Đăng ký sensor nodes...');
  const nodeIds = await provisionNodes();

  if (nodeIds.length === 0) {
    console.error('\n❌ Không tạo được node nào. Kiểm tra lại cấu hình.');
    process.exit(1);
  }

  console.log(`\n   Tổng: ${nodeIds.length} node → [${nodeIds.join(', ')}]`);

  if (PROVISION_ONLY) {
    console.log('\n✅ Chế độ provision-only, không sinh data.');
    await getPrisma().$disconnect();
    return;
  }

  // 2. Sinh dữ liệu
  if (IS_REALTIME) {
    await runRealtime(nodeIds);
    // Realtime chạy mãi, không disconnect
  } else {
    await runBackfill(nodeIds);
    await getPrisma().$disconnect();
  }
}

main().catch(async (err) => {
  console.error('\n❌ Lỗi:', err);
  if (prisma) await prisma.$disconnect();
  process.exit(1);
});
