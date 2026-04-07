const prisma = require('../config/prismaClient');

const CONFIG_ID = 'default';

/**
 * Lấy config hiện tại. Nếu chưa có → tạo row mặc định.
 */
const getConfig = async () => {
  let config = await prisma.alertConfig.findUnique({ where: { id: CONFIG_ID } });

  if (!config) {
    config = await prisma.alertConfig.create({ data: { id: CONFIG_ID } });
    console.log('[Config] Đã tạo config mặc định');
  }

  // Bỏ field id khỏi response (không cần thiết cho client)
  const { id, ...rest } = config;
  return rest;
};

/**
 * Cập nhật config (partial update).
 * Chỉ cập nhật các field được gửi lên.
 */
const updateConfig = async (data) => {
  const updateData = {};

  // Ngưỡng PM2.5
  if (data.pm25_warn !== undefined) updateData.pm25_warn = data.pm25_warn;
  if (data.pm25_danger !== undefined) updateData.pm25_danger = data.pm25_danger;

  // Ngưỡng PM10
  if (data.pm10_warn !== undefined) updateData.pm10_warn = data.pm10_warn;
  if (data.pm10_danger !== undefined) updateData.pm10_danger = data.pm10_danger;

  // Ngưỡng CO2
  if (data.co2_warn !== undefined) updateData.co2_warn = data.co2_warn;
  if (data.co2_danger !== undefined) updateData.co2_danger = data.co2_danger;

  // Ngưỡng TVOC
  if (data.tvoc_warn !== undefined) updateData.tvoc_warn = data.tvoc_warn;
  if (data.tvoc_danger !== undefined) updateData.tvoc_danger = data.tvoc_danger;

  // Nhiệt độ
  if (data.temp_min !== undefined) updateData.temp_min = data.temp_min;
  if (data.temp_max !== undefined) updateData.temp_max = data.temp_max;

  // Sampling interval
  if (data.sampling_interval !== undefined) updateData.sampling_interval = data.sampling_interval;

  const config = await prisma.alertConfig.upsert({
    where: { id: CONFIG_ID },
    update: updateData,
    create: { id: CONFIG_ID, ...updateData },
  });

  const { id, ...rest } = config;
  return rest;
};

module.exports = { getConfig, updateConfig };
