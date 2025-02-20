import { Model, DataTypes, Op } from 'sequelize';
import { Device } from './Device';
import sequelize from '../config/sequelize';

export interface SensorMetadata {
  sensorType?: string;
  location?: string;
  calibrationDate?: Date;
  source?: string;
  calibrated?: boolean;
  rawValue?: number;
  unit?: string;
  accuracy?: number;
  minValue?: number;
  maxValue?: number;
  [key: string]: any;
}

export class SensorData extends Model {
  public id!: string;
  public deviceId!: string;
  public timestamp!: Date;
  public temperature!: number;
  public humidity!: number;
  public light!: number;
  public soilMoisture!: number;
  public waterPumpState!: boolean;
  public nutrientPumpState!: boolean;
  public metadata?: SensorMetadata;

  static async getLatest(deviceName: string) {
    const device = await Device.findOne({
      where: { name: deviceName }
    });

    if (!device) {
      return null;
    }

    return this.findOne({
      where: { deviceId: device.id },
      order: [['timestamp', 'DESC']],
    });
  }

  static async getDataInRange(deviceId: string, startDate: Date, endDate: Date) {
    return this.findAll({
      where: {
        deviceId,
        timestamp: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['timestamp', 'DESC']],
    });
  }

  // Lấy dữ liệu theo khoảng thời gian và loại cảm biến
  static async getDataByType(
    deviceId: string, 
    sensorType: string, 
    startDate: Date, 
    endDate: Date
  ) {
    return this.findAll({
      where: {
        deviceId,
        timestamp: {
          [Op.between]: [startDate, endDate],
        },
        'metadata.sensorType': sensorType
      },
      order: [['timestamp', 'DESC']],
    });
  }

  // Tính giá trị trung bình trong khoảng thời gian
  static async getAverage(
    deviceId: string,
    field: keyof SensorData,
    startDate: Date,
    endDate: Date
  ) {
    const result = await this.findOne({
      where: {
        deviceId,
        timestamp: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col(field as string)), 'average']
      ],
    });

    return result?.getDataValue('average') || 0;
  }

  // Kiểm tra giá trị có vượt ngưỡng không
  isThresholdExceeded(thresholds: Record<string, { min: number; max: number }>) {
    const checkField = (field: keyof SensorData, threshold: { min: number; max: number }) => {
      const value = this[field];
      if (typeof value === 'number') {
        return value < threshold.min || value > threshold.max;
      }
      return false;
    };

    return Object.entries(thresholds).some(([field, threshold]) => 
      checkField(field as keyof SensorData, threshold)
    );
  }
}

SensorData.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    deviceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'devices',
        key: 'id',
      },
      field: 'device_id'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    temperature: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: -50,
        max: 100
      }
    },
    humidity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    },
    light: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 1023
      }
    },
    soilMoisture: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 1023
      },
      field: 'soil_moisture'
    },
    waterPumpState: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'water_pump_state'
    },
    nutrientPumpState: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'nutrient_pump_state'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'SensorData',
    tableName: 'sensor_data',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['device_id', 'timestamp'],
      },
      {
        fields: ['timestamp'],
      },
      {
        fields: ['device_id', 'metadata'],
        using: 'gin',
        operator: 'jsonb_path_ops',
      },
    ],
  }
);

export default SensorData; 