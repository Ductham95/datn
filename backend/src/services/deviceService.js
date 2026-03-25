const { pool } = require('../config/db.config');

const getAllGateways = async () => {
  const { rows } = await pool.query('SELECT * FROM gateways ORDER BY last_seen DESC NULLS LAST');
  return rows;
};

const getAllNodes = async () => {
  const { rows } = await pool.query(`
    SELECT n.*, g.name as gateway_name 
    FROM sensor_nodes n 
    LEFT JOIN gateways g ON n.gateway_id = g.id
    ORDER BY n.id ASC
  `);
  return rows;
};

module.exports = { getAllGateways, getAllNodes };
