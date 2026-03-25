const { Parser } = require('json2csv');
const { pool } = require('../config/db.config');

const getExportCsvData = async (node_id, limit) => {
  const qLimit = parseInt(limit) || 1000;
  
  let queryStr = 'SELECT time, node_id, pm25, pm10, co2, tvoc, temperature, humidity FROM measurements';
  let params = [qLimit];

  if (node_id) {
    queryStr += ' WHERE node_id = $2 ORDER BY time DESC LIMIT $1';
    params.push(node_id);
  } else {
    queryStr += ' ORDER BY time DESC LIMIT $1';
  }

  const { rows } = await pool.query(queryStr, params);
  
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
