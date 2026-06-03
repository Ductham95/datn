// =============================================================================
//  DEDUP CACHE — Chống lặp gói tin LoRa khi nhiều Gateway cùng nhận
//  Key: "node_id:msg_id" → Value: timestamp (ms)
//  TTL: 30s (đủ cho khoảng cách giữa 2 gateway POST)
// =============================================================================

const DEDUP_TTL_MS = 30_000;
const CLEANUP_INTERVAL_MS = 60_000;

const cache = new Map();

/**
 * Kiểm tra gói tin có trùng lặp không.
 * Nếu chưa thấy → đánh dấu đã thấy và trả về false.
 * Nếu đã thấy trong TTL → trả về true (duplicate).
 */
function isDuplicate(nodeId, msgId) {
  const key = `${nodeId}:${msgId}`;
  const now = Date.now();

  const seenAt = cache.get(key);
  if (seenAt && (now - seenAt) < DEDUP_TTL_MS) {
    return true;
  }

  cache.set(key, now);
  return false;
}

// Auto-cleanup expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of cache) {
    if (now - ts >= DEDUP_TTL_MS) {
      cache.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS).unref();

module.exports = { isDuplicate };
