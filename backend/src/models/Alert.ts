import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/sequelize'

export enum AlertType {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export enum AlertSeverity {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum AlertStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved'
}

export interface AlertMetadata {
  errorCode?: string;
  value?: number;
  threshold?: number;
  version?: string;
}

export class Alert extends Model {
  public id!: string;
  public type!: AlertType;
  public message!: string;
  public severity!: AlertSeverity;
  public deviceId!: string;
  public status!: AlertStatus;
  public metadata!: AlertMetadata;
  public createdAt!: Date;
  public resolvedAt?: Date;
  public resolvedBy?: string;
}

Alert.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(AlertType)),
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    severity: {
      type: DataTypes.ENUM(...Object.values(AlertSeverity)),
      allowNull: false,
    },
    deviceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'devices',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(AlertStatus)),
      allowNull: false,
      defaultValue: AlertStatus.ACTIVE,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolvedBy: {
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
    modelName: 'Alert',
    tableName: 'alerts',
    timestamps: true,
    paranoid: true,
    underscored: true,
  }
);

export default Alert; 