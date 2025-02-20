export interface WeeklyStats {
  startDate: string;
  endDate: string;
  energyUsage: {
    total: number;
    byDevice: Array<{
      deviceId: string;
      deviceName: string;
      powerUsage: number;
      hoursActive: number;
    }>;
    previousWeek: number;
    prediction: number;
  };
  waterUsage: {
    total: number;
    byPump: Array<{
      pumpId: string;
      pumpName: string;
      liters: number;
      hoursActive: number;
    }>;
    previousWeek: number;
    prediction: number;
  };
  sensorStats: Array<{
    sensorId: string;
    sensorName: string;
    readings: number;
    uptime: number;
    accuracy: number;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    savings?: {
      energy?: number;
      water?: number;
    };
  }>;
}

interface DailyConsumption {
  date: string;
  value: number;
} 