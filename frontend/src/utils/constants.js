// API & App Constants

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

// API Endpoints
export const API = {
  // User
  DASHBOARD: '/api/v1/stations/dashboard',
  NEAREST: '/api/v1/stations/nearest',
  HISTORY: (id) => `/api/v1/stations/${id}/history`,
  WEATHER: '/api/v1/weather',
  RANKING: '/api/v1/stations/ranking',

  // Gateway telemetry
  TELEMETRY: '/api/v1/telemetry',

  // Admin dashboard
  ADMIN_DASHBOARD_STATS: '/api/v1/admin/dashboard/stats',

  // Admin auth
  LOGIN: '/api/v1/admin/login',

  // Admin devices
  GATEWAYS: '/api/v1/admin/gateways',
  GATEWAY: (id) => `/api/v1/admin/gateways/${id}`,
  NODES: '/api/v1/admin/nodes',
  NODE: (id) => `/api/v1/admin/nodes/${id}`,

  // Admin alerts
  ALERTS: '/api/v1/admin/alerts',
  ALERT_ACK: (id) => `/api/v1/admin/alerts/${id}/ack`,
  ALERT_DELETE: (id) => `/api/v1/admin/alerts/${id}`,

  // Admin config
  CONFIG: '/api/v1/admin/config',

  // Admin users
  USERS: '/api/v1/admin/users',
  USER: (id) => `/api/v1/admin/users/${id}`,
  CHANGE_PASSWORD: '/api/v1/admin/users/change-password',

  // Admin logs
  LOGS: '/api/v1/admin/logs',

  // Admin export
  EXPORT: '/api/v1/admin/export/measurements',

  // Admin telemetry logs
  TELEMETRY_LOGS: '/api/v1/admin/telemetry-logs',

  // Health
  HEALTH: '/health',
};

// Socket events
export const SOCKET_EVENTS = {
  NEW_TELEMETRY: 'new_telemetry_data',
  NEW_ALERT: 'new-alert',
};

// Map defaults
export const MAP_CONFIG = {
  CENTER: [10.7733, 106.6575], // Ho Chi Minh City
  ZOOM: 3,
  MAX_ZOOM: 18,
  TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  TILE_ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

// Refresh intervals (ms)
export const REFRESH_INTERVALS = {
  DASHBOARD: 60000,    // 1 minute
  RANKING: 60000,      // 1 minute
  WEATHER: 300000,     // 5 minutes
  ADMIN_DEVICES: 30000, // 30 seconds
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'aq_auth_token',
  LANGUAGE: 'aq_lang',
  SIDEBAR_COLLAPSED: 'aq_sidebar_collapsed',
};
