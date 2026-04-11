-- =====================================================
-- Database Migrations
-- Chạy an toàn trên DB đã tồn tại (dùng IF NOT EXISTS / IF EXISTS)
-- File này được chạy tự động sau mỗi lần deploy
-- =====================================================

-- [2026-04-11] Thêm cột last_seen cho sensor_nodes
ALTER TABLE sensor_nodes ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

-- [2026-04-11] Đổi default status sensor_nodes: active → offline
-- Node mới tạo sẽ ở trạng thái offline cho đến khi gửi dữ liệu thật
ALTER TABLE sensor_nodes ALTER COLUMN status SET DEFAULT 'offline';

-- [2026-04-11] Fix node chưa bao giờ gửi dữ liệu nhưng đang hiển thị 'active'
UPDATE sensor_nodes SET status = 'offline'
WHERE last_seen IS NULL
  AND id NOT IN (SELECT DISTINCT node_id FROM measurements);
