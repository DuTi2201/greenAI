export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  preferredLanguage: string;
  themePreference: string;
  phoneNumber: string | null;
  dateOfBirth: Date | null;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Garden {
  id: string;
  userId: string;
  name: string;
  wemosSerial: string;
  apiKey: string;
  location: string | null;
  description: string | null;
  status: string;
  lastConnected: Date | null;
  deviceType: string | null;
  firmwareVersion: string | null;
  createdAt: Date;
  updatedAt: Date;
  deviceStatus?: DeviceStatus[];
}

export interface SensorData {
  id: string;
  gardenId: string;
  temperature: number;
  humidity: number;
  lightLevel: number;
  soilMoisture: number;
  recordedAt: Date;
}

export interface DeviceStatus {
  id: string;
  gardenId: string;
  fanStatus: boolean;
  ledStatus: boolean;
  nutrientPumpStatus: boolean;
  waterPumpStatus: boolean;
  updatedAt: Date;
}

export interface AutomationRule {
  id: string;
  gardenId: string;
  sensorType: string;
  conditionOperator: string;
  thresholdValue: number;
  actionDevice: string;
  actionStatus: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Schedule {
  id: string;
  gardenId: string;
  deviceType: string;
  actionStatus: boolean;
  cronExpression: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIAnalysis {
  id: string;
  gardenId: string;
  analysisType: string;
  result: any;
  status: string;
  reportFormat: string;
  analysisPeriodStart: Date;
  analysisPeriodEnd: Date;
  geminiModelVersion: string;
  createdAt: Date;
} 