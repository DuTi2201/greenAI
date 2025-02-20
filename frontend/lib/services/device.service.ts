import { api } from '../api';
import { Device, DeviceStatus } from '@/types/device';
import { API_ENDPOINTS } from '../api-config';

export const deviceService = {
  async getAll(): Promise<Device[]> {
    const response = await api.get(API_ENDPOINTS.DEVICES);
    return response.data;
  },

  async control(deviceId: string, action: 'on' | 'off'): Promise<Device> {
    const response = await api.post(API_ENDPOINTS.DEVICE_CONTROL(deviceId), { action });
    return response.data;
  }
}; 