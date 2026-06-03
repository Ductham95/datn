const { Parser } = require('json2csv');
const prisma = require('../config/prismaClient');

const getExportCsvData = async (node_id, from, to) => {
  const where = {};
  if (node_id) where.node_id = node_id;
  if (from || to) {
    where.time = {};
    if (from) where.time.gte = new Date(from);
    if (to) where.time.lte = new Date(to + 'T23:59:59.999Z');
  }

  const rows = await prisma.measurement.findMany({
    where,
    orderBy: { time: 'desc' },
    select: {
      time: true,
      node_id: true,
      pm25: true,
      pm10: true,
      co2: true,
      tvoc: true,
      temperature: true,
      humidity: true,
    },
  });

  if (rows.length === 0) {
    throw new Error('Không có dữ liệu để xuất');
  }

  const fields = ['time', 'node_id', 'pm25', 'pm10', 'co2', 'tvoc', 'temperature', 'humidity'];
  const opts = { fields };
  const parser = new Parser(opts);
  const csv = parser.parse(rows);
  
  return csv;
};

module.exports = { getExportCsvData };
