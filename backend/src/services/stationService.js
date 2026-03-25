const { pool } = require('../config/db.config');
const { calculateAQI, getAQIInfo, getCO2Info, getTVOCInfo } = require('./aqiService');

const getDashboardData = async () => {
  const result = await pool.query(`
    SELECT 
      n.id as node_id, 
      n.name, 
      n.status, 
      n.battery_level, 
      ST_Y(n.geom::geometry) as lat, 
      ST_X(n.geom::geometry) as lng,
      m.time, 
      m.pm25, m.pm10, m.co2, m.tvoc, m.temperature, m.humidity
    FROM sensor_nodes n
    LEFT JOIN LATERAL (
      SELECT * FROM measurements
      WHERE node_id = n.id
      ORDER BY time DESC
      LIMIT 1
    ) m ON true
    WHERE n.status = 'active'
  `);

  return result.rows.map(row => {
    const aqi = calculateAQI(row.pm25 || 0, row.pm10 || 0);
    return {
      ...row,
      aqi,
      aqi_info: getAQIInfo(aqi),
      co2_info: getCO2Info(row.co2 || 400),
      tvoc_info: getTVOCInfo(row.tvoc || 0)
    };
  });
};

const getNearestStationData = async (lat, lng) => {
  const result = await pool.query(`
    SELECT 
      n.id as node_id, 
      n.name,
      ST_DistanceSphere(n.geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)) AS distance_meters,
      ST_Y(n.geom::geometry) as lat, 
      ST_X(n.geom::geometry) as lng,
      m.pm25, m.pm10, m.temperature, m.humidity
    FROM sensor_nodes n
    LEFT JOIN LATERAL (
      SELECT pm25, pm10, temperature, humidity FROM measurements
      WHERE node_id = n.id ORDER BY time DESC LIMIT 1
    ) m ON true
    WHERE n.status = 'active'
    ORDER BY n.geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
    LIMIT 1;
  `, [lng, lat]);

  if (result.rows.length === 0) {
    throw new Error('Không tìm thấy trạm nào');
  }

  const nearestNode = result.rows[0];
  const aqi = calculateAQI(nearestNode.pm25 || 0, nearestNode.pm10 || 0);
  
  return {
    ...nearestNode,
    aqi,
    aqi_info: getAQIInfo(aqi)
  };
};

const getHistoryData = async (id, type, limit) => {
  const recordLimit = parseInt(limit) || 24;
  let queryStr = '';
  let params = [id, recordLimit];

  if (type === 'hourly') {
    queryStr = `
      SELECT bucket_time as time, 
             avg_pm25 as pm25, avg_pm10 as pm10, 
             avg_co2 as co2, max_temp as temperature
      FROM hourly_measurements
      WHERE node_id = $1
      ORDER BY bucket_time DESC
      LIMIT $2
    `;
  } else {
    queryStr = `
      SELECT time, pm25, pm10, co2, tvoc, temperature, humidity
      FROM measurements
      WHERE node_id = $1
      ORDER BY time DESC
      LIMIT $2
    `;
  }

  const { rows } = await pool.query(queryStr, params);
  
  return rows.map(r => ({
    ...r,
    aqi: calculateAQI(r.pm25 || 0, r.pm10 || 0)
  })).reverse();
};

module.exports = { getDashboardData, getNearestStationData, getHistoryData };
