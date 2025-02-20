import { Model, DataTypes, Sequelize, Optional } from 'sequelize'
import { User } from './User'

interface SensorDataType {
  temperature: number
  humidity: number
  soilMoisture: number
  light: number
}

interface RecommendationType {
  id: string
  title: string
  description: string
  device: string
  action: 'on' | 'off'
  duration?: number
  appliedAt?: Date
  success?: boolean
}

interface AdvisorAttributes {
  id: string
  timestamp: Date
  sensorData: SensorDataType
  healthScore: number
  recommendations: RecommendationType[]
  analysis: string
  userId: string
}

interface AdvisorCreationAttributes extends Optional<AdvisorAttributes, 'id' | 'timestamp' | 'recommendations'> {}

export class Advisor extends Model<AdvisorAttributes, AdvisorCreationAttributes> {
  declare id: string
  declare timestamp: Date
  declare sensorData: SensorDataType
  declare healthScore: number
  declare recommendations: RecommendationType[]
  declare analysis: string
  declare userId: string

  static initModel(sequelize: Sequelize) {
    return this.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        timestamp: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        sensorData: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
        },
        healthScore: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            min: 0,
            max: 100,
          },
        },
        recommendations: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: [],
        },
        analysis: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: User,
            key: 'id',
          },
          field: 'user_id'
        },
      },
      {
        sequelize,
        tableName: 'advisors',
        timestamps: true,
        underscored: true,
        indexes: [
          {
            fields: ['user_id', 'timestamp'],
          },
        ],
      }
    )
  }

  // Associations
  static associate(models: any) {
    this.belongsTo(models.User, { foreignKey: 'userId' })
  }
} 