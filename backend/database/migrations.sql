-- =====================================================
-- Database Migrations
-- Chạy an toàn trên DB đã tồn tại (dùng IF NOT EXISTS / IF EXISTS)
-- File này được chạy tự động sau mỗi lần deploy
-- =====================================================

-- [2026-04-11] Thêm cột last_seen cho sensor_nodes
ALTER TABLE sensor_nodes ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;
