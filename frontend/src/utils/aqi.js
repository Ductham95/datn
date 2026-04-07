// AQI utility functions - colors, levels, labels
// Based on US EPA Air Quality Index standard

export const AQI_LEVELS = [
  { min: 0,   max: 50,  level: 'good',       color: '#22C55E', bg: '#F0FDF4' },
  { min: 51,  max: 100, level: 'moderate',    color: '#EAB308', bg: '#FEFCE8' },
  { min: 101, max: 150, level: 'sensitive',   color: '#F97316', bg: '#FFF7ED' },
  { min: 151, max: 200, level: 'unhealthy',   color: '#EF4444', bg: '#FEF2F2' },
  { min: 201, max: 300, level: 'very_bad',    color: '#8B5CF6', bg: '#F5F3FF' },
  { min: 301, max: 500, level: 'hazardous',   color: '#991B1B', bg: '#FEF2F2' },
];

export const AQI_LABELS = {
  vi: {
    good: 'Tốt',
    moderate: 'Trung bình',
    sensitive: 'Không tốt cho nhóm nhạy cảm',
    unhealthy: 'Không tốt',
    very_bad: 'Rất không tốt',
    hazardous: 'Nguy hiểm',
  },
  en: {
    good: 'Good',
    moderate: 'Moderate',
    sensitive: 'Unhealthy for Sensitive Groups',
    unhealthy: 'Unhealthy',
    very_bad: 'Very Unhealthy',
    hazardous: 'Hazardous',
  },
};

export const AQI_EMOJIS = {
  good: '😊',
  moderate: '😐',
  sensitive: '😷',
  unhealthy: '😨',
  very_bad: '🤢',
  hazardous: '☠️',
};

/**
 * Get AQI level info for a given AQI value
 */
export function getAQILevel(aqi) {
  if (aqi == null || isNaN(aqi)) {
    return AQI_LEVELS[0]; // default to good
  }
  const val = Math.round(aqi);
  return AQI_LEVELS.find(l => val >= l.min && val <= l.max) || AQI_LEVELS[AQI_LEVELS.length - 1];
}

/**
 * Get AQI color for a given AQI value
 */
export function getAQIColor(aqi) {
  return getAQILevel(aqi).color;
}

/**
 * Get AQI background color for a given AQI value
 */
export function getAQIBgColor(aqi) {
  return getAQILevel(aqi).bg;
}

/**
 * Get AQI label for a given AQI value and language
 */
export function getAQILabel(aqi, lang = 'vi') {
  const level = getAQILevel(aqi);
  return AQI_LABELS[lang]?.[level.level] || AQI_LABELS.vi[level.level];
}

/**
 * Get AQI emoji for a given AQI value
 */
export function getAQIEmoji(aqi) {
  const level = getAQILevel(aqi);
  return AQI_EMOJIS[level.level];
}

/**
 * CO2 level evaluation
 */
export function getCO2Level(co2) {
  if (co2 <= 800) return { level: 'good', color: '#22C55E' };
  if (co2 <= 1000) return { level: 'moderate', color: '#EAB308' };
  if (co2 <= 1500) return { level: 'sensitive', color: '#F97316' };
  if (co2 <= 2000) return { level: 'unhealthy', color: '#EF4444' };
  return { level: 'hazardous', color: '#991B1B' };
}

/**
 * TVOC level evaluation
 */
export function getTVOCLevel(tvoc) {
  if (tvoc <= 65) return { level: 'good', color: '#22C55E' };
  if (tvoc <= 220) return { level: 'moderate', color: '#EAB308' };
  if (tvoc <= 660) return { level: 'sensitive', color: '#F97316' };
  if (tvoc <= 2200) return { level: 'unhealthy', color: '#EF4444' };
  return { level: 'hazardous', color: '#991B1B' };
}

/**
 * WHO comparison for PM2.5
 */
export function getWHOComparison(pm25) {
  const WHO_LIMIT = 15; // µg/m³ (24h guideline)
  if (pm25 <= WHO_LIMIT) return null;
  return {
    times: (pm25 / WHO_LIMIT).toFixed(1),
    limit: WHO_LIMIT,
  };
}
