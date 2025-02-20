import { Model, DataTypes, Sequelize } from 'sequelize';
import { Device } from './Device';
import { Advisor } from './Advisor';

export enum AdviceStatus {
  PENDING = 'pending',
  APPLIED = 'applied',
  REJECTED = 'rejected'
}

export class Advice extends Model {
  public id!: string;
  public advisorId!: string;
  public deviceId!: string;
  public title!: string;
  public description!: string;
  public action!: 'on' | 'off';
  public duration?: number;
  public status!: AdviceStatus;
  public appliedAt?: Date;
  public success?: boolean;

  static initModel(sequelize: Sequelize) {
    return this.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        advisorId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: Advisor,
            key: 'id',
          },
          field: 'advisor_id'
        },
        deviceId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: Device,
            key: 'id',
          },
          field: 'device_id'
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        action: {
          type: DataTypes.ENUM('on', 'off'),
          allowNull: false,
        },
        duration: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM(...Object.values(AdviceStatus)),
          allowNull: false,
          defaultValue: AdviceStatus.PENDING,
        },
        appliedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'applied_at'
        },
        success: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'Advice',
        tableName: 'advices',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            fields: ['advisor_id'],
          },
          {
            fields: ['device_id'],
          },
          {
            fields: ['status'],
          },
        ],
      }
    );
  }
} 