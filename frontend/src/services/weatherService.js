import api from './api';
import { API } from '@/utils/constants';

export const weatherService = {
  /** Get current weather by coordinates */
  getWeather(lat, lng) {
    return api.get(API.WEATHER, { params: { lat, lng } }).then(res => res.data);
  },
};
