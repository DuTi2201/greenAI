// API URL
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Pagination
export const DEFAULT_PAGE_SIZE = 10

// Date formats
export const DATE_FORMAT = 'dd/MM/yyyy'
export const TIME_FORMAT = 'HH:mm'
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm'

// Sensor thresholds
export const DEFAULT_THRESHOLDS = {
  temperature: {
    min: 18,
    max: 30,
    unit: '°C',
  },
  humidity: {
    min: 40,
    max: 80,
    unit: '%',
  },
  soilMoisture: {
    min: 30,
    max: 70,
    unit: '%',
  },
  lightLevel: {
    min: 1000,
    max: 10000,
    unit: 'lux',
  },
}

// Device types
export const DEVICE_TYPES = {
  FAN: 'fan',
  LED: 'led',
  WATER_PUMP: 'waterPump',
  NUTRIENT_PUMP: 'nutrientPump',
}

// Sensor types
export const SENSOR_TYPES = {
  TEMPERATURE: 'temperature',
  HUMIDITY: 'humidity',
  SOIL_MOISTURE: 'soilMoisture',
  LIGHT_LEVEL: 'lightLevel',
  SCHEDULE: 'schedule',
}

// Report types
export const REPORT_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
}

// Alert severity levels
export const ALERT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} 