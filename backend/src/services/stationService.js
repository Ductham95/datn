const prisma = require('../config/prismaClient');
const { calculateAQI, getAQIInfo, getCO2Info, getTVOCInfo } = require('./aqiService');

const getDashboardData = async () => {
  // Dùng $queryRaw vì cần PostGIS functions (ST_Y, ST_X) và LATERAL JOIN
  const rows = await prisma.$queryRaw`
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
    ORDER BY n.name
  `;

  return rows.map(row => {
    const aqi = calculateAQI(Number(row.pm25) || 0, Number(row.pm10) || 0);
    return {
      ...row,
      aqi,
      aqi_info: getAQIInfo(aqi),
      co2_info: getCO2Info(Number(row.co2) || 400),
      tvoc_info: getTVOCInfo(Number(row.tvoc) || 0)
    };
  });
};

const getNearestStationData = async (lat, lng) => {
  const lngNum = parseFloat(lng);
  const latNum = parseFloat(lat);

  // Dùng $queryRaw vì cần PostGIS functions (ST_DistanceSphere, <-> operator)
  const rows = await prisma.$queryRaw`
    SELECT 
      n.id as node_id, 
      n.name,
      ST_DistanceSphere(n.geom, ST_SetSRID(ST_MakePoint(${lngNum}, ${latNum}), 4326)) AS distance_meters,
      ST_Y(n.geom::geometry) as lat, 
      ST_X(n.geom::geometry) as lng,
      m.pm25, m.pm10, m.temperature, m.humidity
    FROM sensor_nodes n
    LEFT JOIN LATERAL (
      SELECT pm25, pm10, temperature, humidity FROM measurements
      WHERE node_id = n.id ORDER BY time DESC LIMIT 1
    ) m ON true
    ORDER BY n.geom <-> ST_SetSRID(ST_MakePoint(${lngNum}, ${latNum}), 4326)
    LIMIT 1
  `;

  if (rows.length === 0) {
    throw new Error('Không tìm thấy trạm nào');
  }

  const nearestNode = rows[0];
  const aqi = calculateAQI(Number(nearestNode.pm25) || 0, Number(nearestNode.pm10) || 0);
  
  return {
    ...nearestNode,
    aqi,
    aqi_info: getAQIInfo(aqi)
  };
};

const getHistoryData = async (id, type, limit) => {
  const recordLimit = parseInt(limit) || 24;

  if (type === 'hourly') {
    // Dùng $queryRaw vì truy vấn hourly_measurements (TimescaleDB continuous aggregate)
    const rows = await prisma.$queryRaw`
      SELECT bucket_time as time, 
             avg_pm25 as pm25, avg_pm10 as pm10, 
             avg_co2 as co2, max_temp as temperature
      FROM hourly_measurements
      WHERE node_id = ${id}
      ORDER BY bucket_time DESC
      LIMIT ${recordLimit}
    `;

    return rows.map(r => ({
      ...r,
      aqi: calculateAQI(Number(r.pm25) || 0, Number(r.pm10) || 0)
    })).reverse();
  } else {
    // Query thông thường có thể dùng Prisma Client
    const rows = await prisma.measurement.findMany({
      where: { node_id: id },
      orderBy: { time: 'desc' },
      take: recordLimit,
    });

    return rows.map(r => ({
      ...r,
      aqi: calculateAQI(r.pm25 || 0, r.pm10 || 0)
    })).reverse();
  }
};

// ==================== RANKING ====================

/**
 * Xếp hạng các trạm theo AQI từ cao → thấp
 * Reuse getDashboardData() rồi sort
 */
const getRankingData = async () => {
  const stations = await getDashboardData();
  return stations
    .filter(s => s.aqi != null)
    .sort((a, b) => b.aqi - a.aqi)
    .map((s, index) => ({ rank: index + 1, ...s }));
};

module.exports = { getDashboardData, getNearestStationData, getHistoryData, getRankingData };
