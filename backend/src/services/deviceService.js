const prisma = require('../config/prismaClient');

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

module.exports = { getAllGateways, getAllNodes };
