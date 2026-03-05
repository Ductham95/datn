/**
 * AQI Calculation Service
 * Tính chỉ số AQI theo chuẩn US EPA và đánh giá CO2/TVOC
 */

// Bảng breakpoint AQI cho PM2.5 (US EPA)
const PM25_BREAKPOINTS = [
  { bpLo: 0.0, bpHi: 12.0, aqiLo: 0, aqiHi: 50 },
  { bpLo: 12.1, bpHi: 35.4, aqiLo: 51, aqiHi: 100 },
  { bpLo: 35.5, bpHi: 55.4, aqiLo: 101, aqiHi: 150 },
  { bpLo: 55.5, bpHi: 150.4, aqiLo: 151, aqiHi: 200 },
  { bpLo: 150.5, bpHi: 250.4, aqiLo: 201, aqiHi: 300 },
  { bpLo: 250.5, bpHi: 500.4, aqiLo: 301, aqiHi: 500 },
];

// Bảng breakpoint AQI cho PM10 (US EPA)
const PM10_BREAKPOINTS = [
  { bpLo: 0, bpHi: 54, aqiLo: 0, aqiHi: 50 },
  { bpLo: 55, bpHi: 154, aqiLo: 51, aqiHi: 100 },
  { bpLo: 155, bpHi: 254, aqiLo: 101, aqiHi: 150 },
  { bpLo: 255, bpHi: 354, aqiLo: 151, aqiHi: 200 },
  { bpLo: 355, bpHi: 424, aqiLo: 201, aqiHi: 300 },
  { bpLo: 425, bpHi: 604, aqiLo: 301, aqiHi: 500 },
];

/**
 * Tính AQI từ nồng độ chất ô nhiễm
 */
function calculateSubAQI(concentration, breakpoints) {
  for (const bp of breakpoints) {
    if (concentration >= bp.bpLo && concentration <= bp.bpHi) {
      return Math.round(
        ((bp.aqiHi - bp.aqiLo) / (bp.bpHi - bp.bpLo)) *
          (concentration - bp.bpLo) +
          bp.aqiLo
      );
    }
  }
  return 500; // Vượt ngưỡng
}

/**
 * Tính AQI tổng hợp (lấy giá trị cao nhất giữa PM2.5 và PM10)
 */
function calculateAQI(pm25, pm10) {
  const aqiPM25 = calculateSubAQI(pm25, PM25_BREAKPOINTS);
  const aqiPM10 = calculateSubAQI(pm10, PM10_BREAKPOINTS);
  return Math.max(aqiPM25, aqiPM10);
}

/**
 * Lấy thông tin mức AQI
 */
function getAQIInfo(aqi) {
  if (aqi <= 50)
    return { level: 'good', label: 'Tốt', color: '#00e400', emoji: '🟢' };
  if (aqi <= 100)
    return {
      level: 'moderate',
      label: 'Trung bình',
      color: '#ffff00',
      emoji: '🟡',
    };
  if (aqi <= 150)
    return {
      level: 'unhealthy_sensitive',
      label: 'Không tốt cho nhóm nhạy cảm',
      color: '#ff7e00',
      emoji: '🟠',
    };
  if (aqi <= 200)
    return {
      level: 'unhealthy',
      label: 'Không tốt',
      color: '#ff0000',
      emoji: '🔴',
    };
  if (aqi <= 300)
    return {
      level: 'very_unhealthy',
      label: 'Rất không tốt',
      color: '#8f3f97',
      emoji: '🟣',
    };
  return {
    level: 'hazardous',
    label: 'Nguy hiểm',
    color: '#7e0023',
    emoji: '🟤',
  };
}

/**
 * Đánh giá CO2
 */
function getCO2Info(co2) {
  if (co2 <= 800)
    return { level: 'good', label: 'Tốt', color: '#00e400' };
  if (co2 <= 1000)
    return { level: 'moderate', label: 'Trung bình', color: '#ffff00' };
  if (co2 <= 1500)
    return { level: 'poor', label: 'Kém', color: '#ff7e00' };
  if (co2 <= 2000)
    return { level: 'bad', label: 'Xấu', color: '#ff0000' };
  return { level: 'dangerous', label: 'Nguy hiểm', color: '#7e0023' };
}

/**
 * Đánh giá TVOC
 */
function getTVOCInfo(tvoc) {
  if (tvoc <= 65)
    return { level: 'good', label: 'Tốt', color: '#00e400' };
  if (tvoc <= 220)
    return { level: 'moderate', label: 'Trung bình', color: '#ffff00' };
  if (tvoc <= 660)
    return { level: 'poor', label: 'Kém', color: '#ff7e00' };
  if (tvoc <= 2200)
    return { level: 'bad', label: 'Xấu', color: '#ff0000' };
  return { level: 'dangerous', label: 'Nguy hiểm', color: '#7e0023' };
}

module.exports = {
  calculateAQI,
  calculateSubAQI,
  getAQIInfo,
  getCO2Info,
  getTVOCInfo,
};
