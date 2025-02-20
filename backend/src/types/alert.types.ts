export interface AlertData {
  type: 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  deviceId?: string;
  deviceName?: string;
  sensorData?: {
    temperature?: number;
    humidity?: number;
    soilMoisture?: number;
    light?: number;
  };
} 