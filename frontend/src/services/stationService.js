import api from './api';
import { API } from '@/utils/constants';

export const stationService = {
  /** Get dashboard data: all stations + latest AQI */
  getDashboard() {
    return api.get(API.DASHBOARD).then(res => res.data);
  },

  /** Get nearest station by GPS coordinates */
  getNearestStation(lat, lng) {
    return api.get(API.NEAREST, { params: { lat, lng } }).then(res => res.data);
  },

  /** Get station history data */
  getHistory(id, { type = 'hourly', limit, from, to } = {}) {
    return api.get(API.HISTORY(id), { params: { type, limit, from, to } }).then(res => res.data);
  },

  /** Get pollution ranking */
  getRanking() {
    return api.get(API.RANKING).then(res => res.data);
  },
};
