import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

export class SystemConfig extends Model {
  public id!: string;
  public deviceId!: string;
  public soilMoistureThreshold!: number;
  public nutrientInterval!: number;
  public nutrientDuration!: number;
  public waterPumpDuration!: number;
  public isActive!: boolean;
  public metadata?: {
    description?: string;
    lastModifiedBy?: string;
    notes?: string;
    [key: string]: any;
  };
}

SystemConfig.init(
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
    soilMoistureThreshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 500,
      field: 'soil_moisture_threshold'
    },
    nutrientInterval: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60000, // 60 seconds
      field: 'nutrient_interval'
    },
    nutrientDuration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2000, // 2 seconds
      field: 'nutrient_duration'
    },
    waterPumpDuration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3000, // 3 seconds
      field: 'water_pump_duration'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'SystemConfig',
    tableName: 'system_configs',
    timestamps: true,
    paranoid: true,
    underscored: true,
  }
);

export default SystemConfig; 