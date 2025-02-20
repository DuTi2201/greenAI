export enum DeviceType {
  LED = 'led',
  FAN = 'fan',
  WATER_PUMP = 'water_pump',
  NUTRIENT_PUMP = 'nutrient_pump',
  SENSOR = 'sensor',
  WEMOS = 'wemos',
  ARDUINO = 'arduino'
}

export enum DeviceStatus {
  ON = 'on',
  OFF = 'off',
  ERROR = 'error',
  DISCONNECTED = 'disconnected'
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  isActive: boolean;
  metadata?: {
    [key: string]: any;
  };
} 