import api from './api';
import { API } from '@/utils/constants';

export const alertService = {
  getAlerts(params = {}) {
    return api.get(API.ALERTS, { params }).then(res => res.data);
  },
  acknowledgeAlert(id) {
    return api.patch(API.ALERT_ACK(id)).then(res => res.data);
  },
  deleteAlert(id) {
    return api.delete(API.ALERT_DELETE(id)).then(res => res.data);
  },
};

export const configService = {
  getConfig() {
    return api.get(API.CONFIG).then(res => res.data);
  },
  updateConfig(data) {
    return api.put(API.CONFIG, data).then(res => res.data);
  },
};

export const userService = {
  getUsers() {
    return api.get(API.USERS).then(res => res.data);
  },
  createUser(data) {
    return api.post(API.USERS, data).then(res => res.data);
  },
  updateUser(id, data) {
    return api.put(API.USER(id), data).then(res => res.data);
  },
  deleteUser(id) {
    return api.delete(API.USER(id)).then(res => res.data);
  },
  changePassword(data) {
    return api.put(API.CHANGE_PASSWORD, data).then(res => res.data);
  },
};

export const logService = {
  getLogs(params = {}) {
    return api.get(API.LOGS, { params }).then(res => res.data);
  },
};

export const exportService = {
  exportMeasurements(params = {}) {
    return api.get(API.EXPORT, {
      params,
      responseType: 'blob',
    }).then(res => {
      // Trigger file download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `measurements_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  },
};
