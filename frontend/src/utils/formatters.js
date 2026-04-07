import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);

/**
 * Format number with fixed decimals
 */
export function formatNumber(value, decimals = 1) {
  if (value == null || isNaN(value)) return '--';
  return Number(value).toFixed(decimals);
}

/**
 * Format integer (no decimals)
 */
export function formatInteger(value) {
  if (value == null || isNaN(value)) return '--';
  return Math.round(value).toLocaleString();
}

/**
 * Format temperature
 */
export function formatTemp(value) {
  if (value == null) return '--°C';
  return `${formatNumber(value)}°C`;
}

/**
 * Format humidity
 */
export function formatHumidity(value) {
  if (value == null) return '--%';
  return `${formatNumber(value)}%`;
}

/**
 * Format PM value with unit
 */
export function formatPM(value) {
  if (value == null) return '-- µg/m³';
  return `${formatNumber(value)} µg/m³`;
}

/**
 * Format date to readable string
 */
export function formatDate(date, locale = 'vi') {
  if (!date) return '--';
  return dayjs(date).locale(locale).format('DD/MM/YYYY');
}

/**
 * Format datetime to readable string
 */
export function formatDateTime(date, locale = 'vi') {
  if (!date) return '--';
  return dayjs(date).locale(locale).format('DD/MM/YYYY HH:mm');
}

/**
 * Format time only
 */
export function formatTime(date) {
  if (!date) return '--';
  return dayjs(date).format('HH:mm');
}

/**
 * Format relative time (e.g., "5 phút trước")
 */
export function formatRelativeTime(date, locale = 'vi') {
  if (!date) return '--';
  return dayjs(date).locale(locale).fromNow();
}

/**
 * Format battery level with icon hint
 */
export function formatBattery(level) {
  if (level == null) return '--';
  return `${level}%`;
}

/**
 * Get battery status (for icon/color selection)
 */
export function getBatteryStatus(level) {
  if (level == null) return 'unknown';
  if (level > 75) return 'full';
  if (level > 50) return 'high';
  if (level > 25) return 'medium';
  if (level > 10) return 'low';
  return 'critical';
}

/**
 * Format RSSI value
 */
export function formatRSSI(rssi) {
  if (rssi == null) return '-- dBm';
  return `${rssi} dBm`;
}

/**
 * Format distance in meters/km
 */
export function formatDistance(meters) {
  if (meters == null) return '--';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
