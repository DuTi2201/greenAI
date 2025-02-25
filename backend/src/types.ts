export interface AutomationRule {
  id: string;
  gardenId: string;
  name?: string;
  sensorType: string;
  conditionOperator: string;
  thresholdValue: number;
  actionDevice: string;
  actionStatus: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  delayTime: number;
  priority: number;
  scheduleTime?: string;
  scheduleType?: string;
  scheduleDay?: number;
  scheduleDate?: Date;
  lastExecuted?: Date;
}

export type Schedule = {
  id: string;
  gardenId: string;
  deviceType: string;
  actionStatus: boolean;
  cronExpression: string;
  isActive: boolean;
};

export interface AIReport {
  id: string;
  gardenId: string;
  reportType: string;
  result: any;
  analysisPeriodStart: Date;
  analysisPeriodEnd: Date;
  geminiModelVersion: string;
  createdAt: Date;
  reportFormat: string;
  status: string;
}

export interface AIAnalysisRequest {
  gardenId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  reportType: string;
}

export interface AIAnalysisResponse {
  reportId: string;
  status: string;
  message: string;
}

export interface AIPredictionRequest {
  gardenId: string;
  predictionHorizon: number; // Số ngày dự đoán trong tương lai
}

export interface AIPredictionResponse {
  predictions: {
    temperature: Array<{date: string, value: number, confidence: number}>;
    humidity: Array<{date: string, value: number, confidence: number}>;
    soilMoisture: Array<{date: string, value: number, confidence: number}>;
    lightLevel: Array<{date: string, value: number, confidence: number}>;
  };
  alerts: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    message: string;
    timestamp: string;
  }>;
  recommendations: Array<string>;
}

export interface AIAlert {
  id: string;
  gardenId: string;
  type: string;
  severity: string;
  message: string;
  isRead: boolean;
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Garden {
  id: string;
  userId: string;
  name: string;
  wemosSerial: string;
  apiKey: string;
  location?: string;
  description?: string;
  status: string;
  lastConnected?: Date;
  createdAt: Date;
  updatedAt: Date;
  deviceType?: string;
  firmwareVersion?: string;
}

export interface SensorData {
  id: string;
  gardenId: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightLevel: number;
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