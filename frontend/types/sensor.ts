export interface SensorData {
  id: string;
  deviceId: string;
  timestamp: Date;
  temperature: number;
  humidity: number;
  light: number;
  soilMoisture: number;
  waterPumpState: boolean;
  nutrientPumpState: boolean;
  metadata?: {
    sensorType?: string;
    location?: string;
    calibrationDate?: Date;
    source?: string;
    calibrated?: boolean;
    [key: string]: any;
  };
} 