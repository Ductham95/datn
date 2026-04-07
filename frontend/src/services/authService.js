import api from './api';
import { API } from '@/utils/constants';

export const authService = {
  /** Admin login — returns JWT token */
  login(username, password) {
    return api.post(API.LOGIN, { username, password }).then(res => res.data);
  },
};
