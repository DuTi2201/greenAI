import { api } from '../api';
import { API_ENDPOINTS } from '../api-config';

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'success';
  message: string;
  createdAt: string;
  status: 'active' | 'resolved';
  read: boolean;
}

export const alertService = {
  getAll: async (): Promise<Alert[]> => {
    const response = await api.get(API_ENDPOINTS.ALERTS);
    return response.data;
  },

  markAsRead: async (id: string): Promise<Alert> => {
    const response = await api.patch(`${API_ENDPOINTS.ALERTS}/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch(`${API_ENDPOINTS.ALERTS}/read-all`);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${API_ENDPOINTS.ALERTS}/${id}`);
  },
}; 