const prisma = require('../config/prismaClient');

// ==================== READ (Giữ nguyên) ====================

const getAllGateways = async () => {
  return prisma.gateway.findMany({
    orderBy: { last_seen: { sort: 'desc', nulls: 'last' } },
  });
};

const getAllNodes = async () => {
  const nodes = await prisma.sensorNode.findMany({
    include: { gateway: { select: { name: true } } },
    orderBy: { id: 'asc' },
  });

  // Map gateway.name thành gateway_name để giữ nguyên API response format
  return nodes.map(node => ({
    ...node,
    gateway_name: node.gateway?.name || null,
    gateway: undefined,
  }));
};

// ==================== AUTO-ID ====================

/**
 * Tự sinh ID theo format PREFIX_XXX (VD: GW_001, NODE_005)
 * Tìm ID lớn nhất hiện có → tăng thêm 1
 */
const generateId = async (model, prefix) => {
  const items = await model.findMany({
    select: { id: true },
    orderBy: { id: 'desc' },
    take: 1,
  });

  let nextNum = 1;
  if (items.length > 0) {
    const lastId = items[0].id;
    const match = lastId.match(/_(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}_${String(nextNum).padStart(3, '0')}`;
};

// ==================== GATEWAY CRUD ====================

const createGateway = async ({ name, location_desc }) => {
  const id = await generateId(prisma.gateway, 'GW');

  return prisma.gateway.create({
    data: {
      id,
      name: name.trim(),
      location_desc: location_desc?.trim() || null,
      status: 'offline',
    },
  });
};

const updateGateway = async (id, data) => {
  // Kiểm tra tồn tại
  const existing = await prisma.gateway.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error('Gateway không tồn tại');
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Chỉ cập nhật các field được gửi lên
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.location_desc !== undefined) updateData.location_desc = data.location_desc.trim();
  if (data.status !== undefined) updateData.status = data.status;

  return prisma.gateway.update({
    where: { id },
    data: updateData,
  });
};

const deleteGateway = async (id) => {
  // Kiểm tra tồn tại
  const existing = await prisma.gateway.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error('Gateway không tồn tại');
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Chặn xóa nếu còn sensor nodes liên quan
  const nodeCount = await prisma.sensorNode.count({ where: { gateway_id: id } });
  if (nodeCount > 0) {
    const error = new Error(
      `Không thể xóa Gateway "${existing.name}" vì còn ${nodeCount} sensor node đang liên kết. ` +
      `Vui lòng xóa hoặc chuyển tất cả sensor nodes trước khi xóa gateway.`
    );
    error.code = 'HAS_DEPENDENCIES';
    error.details = { nodeCount };
    throw error;
  }

  await prisma.gateway.delete({ where: { id } });
  return { id, name: existing.name };
};

// ==================== SENSOR NODE CRUD ====================

const createNode = async ({ name, gateway_id, lat, lng, status, battery_level }) => {
  // Kiểm tra gateway tồn tại
  const gateway = await prisma.gateway.findUnique({ where: { id: gateway_id } });
  if (!gateway) {
    const error = new Error(`Gateway "${gateway_id}" không tồn tại`);
    error.code = 'INVALID_REFERENCE';
    throw error;
  }

  const id = await generateId(prisma.sensorNode, 'NODE');

  // Tạo node (không có geom trước)
  const node = await prisma.sensorNode.create({
    data: {
      id,
      name: name.trim(),
      gateway_id,
      status: status || 'offline',
      battery_level: battery_level ?? 100,
    },
  });

  // Nếu có tọa độ → cập nhật geom bằng raw SQL (Prisma không hỗ trợ PostGIS native)
  if (lat !== undefined && lng !== undefined) {
    await prisma.$executeRawUnsafe(
      `UPDATE sensor_nodes SET geom = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
      lng, lat, id
    );
  }

  return { ...node, lat, lng };
};

const updateNode = async (id, data) => {
  // Kiểm tra node tồn tại
  const existing = await prisma.sensorNode.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error('Sensor Node không tồn tại');
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Nếu đổi gateway_id → kiểm tra gateway mới tồn tại
  if (data.gateway_id !== undefined) {
    const gateway = await prisma.gateway.findUnique({ where: { id: data.gateway_id } });
    if (!gateway) {
      const error = new Error(`Gateway "${data.gateway_id}" không tồn tại`);
      error.code = 'INVALID_REFERENCE';
      throw error;
    }
  }

  // Cập nhật các field qua Prisma
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.gateway_id !== undefined) updateData.gateway_id = data.gateway_id;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.battery_level !== undefined) updateData.battery_level = data.battery_level;

  const updated = await prisma.sensorNode.update({
    where: { id },
    data: updateData,
  });

  // Cập nhật tọa độ nếu có
  if (data.lat !== undefined && data.lng !== undefined) {
    await prisma.$executeRawUnsafe(
      `UPDATE sensor_nodes SET geom = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
      data.lng, data.lat, id
    );
  }

  return { ...updated, lat: data.lat, lng: data.lng };
};

const deleteNode = async (id) => {
  // Kiểm tra tồn tại
  const existing = await prisma.sensorNode.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error('Sensor Node không tồn tại');
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Chặn xóa nếu còn measurements liên quan
  const measurementCount = await prisma.measurement.count({ where: { node_id: id } });
  if (measurementCount > 0) {
    const error = new Error(
      `Không thể xóa Sensor Node "${existing.name}" vì còn ${measurementCount} bản ghi đo lường liên quan. ` +
      `Vui lòng xóa dữ liệu đo lường trước hoặc liên hệ quản trị viên hệ thống.`
    );
    error.code = 'HAS_DEPENDENCIES';
    error.details = { measurementCount };
    throw error;
  }

  await prisma.sensorNode.delete({ where: { id } });
  return { id, name: existing.name };
};

module.exports = {
  // Read
  getAllGateways,
  getAllNodes,
  // Gateway CRUD
  createGateway,
  updateGateway,
  deleteGateway,
  // Node CRUD
  createNode,
  updateNode,
  deleteNode,
};
