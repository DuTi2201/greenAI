import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class Setting extends Model {
  public key!: string;
  public value!: string;
}

Setting.init(
  {
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Setting',
    tableName: 'settings',
    timestamps: true,
    underscored: true,
  }
);

export default Setting; 