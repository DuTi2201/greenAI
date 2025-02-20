import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

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

export interface DeviceMetadata {
  location?: string;
  description?: string;
  power?: number;
  flowRate?: number;
  manufacturer?: string;
  model?: string;
  installDate?: Date;
  maintenanceInterval?: number;
  lastMaintenance?: Date;
  operatingHours?: {
    start: string;
    end: string;
  };
  sensorTypes?: string[];
  readingInterval?: number;
  ipAddress?: string;        // Cho Wemos
  macAddress?: string;       // Cho Wemos
  firmwareVersion?: string;  // Cho cả Arduino và Wemos
  lastConnected?: Date;      // Thời điểm kết nối cuối
  autoMode?: boolean;        // Chế độ tự động/thủ công
}

export interface DeviceAction {
  action: DeviceStatus;
  timestamp: Date;
  duration?: number;
  userId?: string;
  success: boolean;
  error?: string;
}

export class Device extends Model {
  public id!: string;
  public name!: string;
  public type!: DeviceType;
  public status!: DeviceStatus;
  public isActive!: boolean;
  public metadata!: DeviceMetadata;
  public lastAction?: DeviceAction | null;
  public createdBy!: string;

  // Tính toán điện năng tiêu thụ (kWh)
  calculateEnergyConsumption(hours: number): number {
    if (!this.metadata?.power) return 0;
    return (this.metadata.power * hours) / 1000;
  }

  // Tính toán lượng nước tiêu thụ (L)
  calculateWaterConsumption(minutes: number): number {
    if (!this.metadata?.flowRate) return 0;
    return this.metadata.flowRate * minutes;
  }

  // Kiểm tra thiết bị có đang online không
  isOnline(): boolean {
    if (!this.metadata?.lastConnected) return false;
    const offlineThreshold = 1000 * 60; // 1 phút
    return Date.now() - new Date(this.metadata.lastConnected).getTime() < offlineThreshold;
  }

  // Cập nhật trạng thái kết nối
  async updateConnectionStatus() {
    if (!this.isOnline()) {
      this.status = DeviceStatus.DISCONNECTED;
      await this.save();
    }
  }
}

Device.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(DeviceType)),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(DeviceStatus)),
      allowNull: false,
      defaultValue: DeviceStatus.OFF,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    lastAction: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Device',
    tableName: 'devices',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        fields: ['type', 'status'],
      },
      {
        fields: ['created_by'],
      },
    ],
  }
);

export default Device; 