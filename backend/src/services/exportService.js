const { Parser } = require('json2csv');
const prisma = require('../config/prismaClient');

const getExportCsvData = async (node_id, limit) => {
  const qLimit = parseInt(limit) || 1000;

  const where = node_id ? { node_id } : {};
  
  const rows = await prisma.measurement.findMany({
    where,
    orderBy: { time: 'desc' },
    take: qLimit,
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
