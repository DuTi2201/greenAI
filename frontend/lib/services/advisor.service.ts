import { api } from '../api';
import { API_ENDPOINTS } from '../api-config';

export interface SensorData {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  light: number;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  device?: string;
  action?: 'on' | 'off';
  duration?: number;
  appliedAt?: string;
  success?: boolean;
}

export interface AdvisorResponse {
  id: string;
  timestamp: string;
  sensorData: SensorData;
  healthScore: number;
  recommendations: Recommendation[];
  analysis: string;
}

export const advisorService = {
  analyze: async (): Promise<AdvisorResponse> => {
    const response = await api.post(API_ENDPOINTS.ADVISOR_ANALYZE);
    return response.data;
  },

  getHistory: async (): Promise<AdvisorResponse[]> => {
    const response = await api.get(API_ENDPOINTS.ADVISOR_HISTORY);
    return response.data;
  },
}; 