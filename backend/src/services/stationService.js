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

  // Derive the time window: hourly+24→24h, daily+7→7d, daily+30→30d
  const intervalMap = { hourly: `${recordLimit} hours`, daily: `${recordLimit} days` };
  const interval = intervalMap[type] || `${recordLimit} hours`;

  if (type === 'daily') {
    // Aggregate by day, filtered to the last N days
    const rows = await prisma.$queryRaw`
      SELECT time_bucket('1 day', time) AS bucket_time,
             AVG(pm25) AS pm25, AVG(pm10) AS pm10,
             AVG(co2) AS co2, AVG(temperature) AS temperature,
             AVG(humidity) AS humidity
      FROM measurements
      WHERE node_id = ${id}
        AND time >= NOW() - ${interval}::interval
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    return rows.map(r => ({
      ...r,
      time: r.bucket_time,
      pm25: r.pm25 != null ? Number(Number(r.pm25).toFixed(1)) : null,
      pm10: r.pm10 != null ? Number(Number(r.pm10).toFixed(1)) : null,
      co2: r.co2 != null ? Math.round(Number(r.co2)) : null,
      temperature: r.temperature != null ? Number(Number(r.temperature).toFixed(1)) : null,
      humidity: r.humidity != null ? Number(Number(r.humidity).toFixed(1)) : null,
      aqi: calculateAQI(Number(r.pm25) || 0, Number(r.pm10) || 0),
    }));
  } else if (type === 'hourly') {
    // Hourly from continuous aggregate, filtered to the last N hours
    const rows = await prisma.$queryRaw`
      SELECT h.bucket_time AS time,
             h.avg_pm25 AS pm25, h.avg_pm10 AS pm10,
             h.avg_co2 AS co2, h.max_temp AS temperature,
             sub.humidity
      FROM hourly_measurements h
      LEFT JOIN LATERAL (
        SELECT AVG(humidity) AS humidity
        FROM measurements m
        WHERE m.node_id = h.node_id
          AND m.time >= h.bucket_time
          AND m.time < h.bucket_time + INTERVAL '1 hour'
      ) sub ON true
      WHERE h.node_id = ${id}
        AND h.bucket_time >= NOW() - ${interval}::interval
      ORDER BY h.bucket_time ASC
    `;

    return rows.map(r => ({
      ...r,
      pm25: r.pm25 != null ? Number(Number(r.pm25).toFixed(1)) : null,
      pm10: r.pm10 != null ? Number(Number(r.pm10).toFixed(1)) : null,
      co2: r.co2 != null ? Math.round(Number(r.co2)) : null,
      temperature: r.temperature != null ? Number(Number(r.temperature).toFixed(1)) : null,
      humidity: r.humidity != null ? Number(Number(r.humidity).toFixed(1)) : null,
      aqi: calculateAQI(Number(r.pm25) || 0, Number(r.pm10) || 0),
    }));
  } else {
    // Raw data fallback
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
