export interface WeeklyStats {
  startDate: Date;
  endDate: Date;
  energyUsage: {
    total: number;
    byDevice: {
      deviceId: string;
      deviceName: string;
      powerUsage: number;
      hoursActive: number;
    }[];
    previousWeek: number;
    prediction: number;
  };
  waterUsage: {
    total: number;
    byPump: {
      pumpId: string;
      pumpName: string;
      liters: number;
      hoursActive: number;
    }[];
    previousWeek: number;
    prediction: number;
  };
  sensorStats: {
    sensorId: string;
    sensorName: string;
    uptime: number;
    readings: number;
    accuracy: number;
  }[];
  recommendations: {
    title: string;
    description: string;
    savings: {
      energy?: number;
      water?: number;
    };
  }[];
} 