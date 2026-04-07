import api from './api';
import { API } from '@/utils/constants';

export const deviceService = {
  // Gateways
  getGateways() {
    return api.get(API.GATEWAYS).then(res => res.data);
  },
  createGateway(data) {
    return api.post(API.GATEWAYS, data).then(res => res.data);
  },
  updateGateway(id, data) {
    return api.put(API.GATEWAY(id), data).then(res => res.data);
  },
  deleteGateway(id) {
    return api.delete(API.GATEWAY(id)).then(res => res.data);
  },

  // Sensor Nodes
  getNodes() {
    return api.get(API.NODES).then(res => res.data);
  },
  createNode(data) {
    return api.post(API.NODES, data).then(res => res.data);
  },
  updateNode(id, data) {
    return api.put(API.NODE(id), data).then(res => res.data);
  },
  deleteNode(id) {
    return api.delete(API.NODE(id)).then(res => res.data);
  },
};
