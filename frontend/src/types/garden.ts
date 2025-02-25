export interface Garden {
  id: string;
  wemosSerial: string;
  apiKey: string;
  name: string;
  userId: string;
  location: string | null;
  description: string | null;
  status: string;
  lastConnected: string | null;
  deviceType: string | null;
  firmwareVersion: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceStatus {
  id: string;
  gardenId: string;
  fanStatus: boolean;
  ledStatus: boolean;
  nutrientPumpStatus: boolean;
  waterPumpStatus: boolean;
  updatedAt: string;
}

export interface AutomationRule {
  id: string;
  gardenId: string;
  sensorType: string;
  conditionOperator: string;
  thresholdValue: number;
  actionDevice: string;
  actionStatus: boolean;
  priority: number;
  delayTime: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SensorData {
  id: string;
  gardenId: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightLevel: number;
  recordedAt: string;
} 