import { api } from '../api';
import { API_ENDPOINTS } from '../api-config';

export interface SensorData {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  light: number;
  timestamp: string;
}

export const sensorService = {
  getLatest: async (): Promise<SensorData> => {
    const response = await api.get(API_ENDPOINTS.SENSOR_LATEST);
    return response.data;
  },

  getHistory: async (limit: number = 100): Promise<SensorData[]> => {
    const response = await api.get(API_ENDPOINTS.SENSOR_HISTORY, {
      params: { limit },
    });
    return response.data;
  },
}; 