"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemConfig = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = __importDefault(require("../config/sequelize"));
class SystemConfig extends sequelize_1.Model {
}
exports.SystemConfig = SystemConfig;
SystemConfig.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    deviceId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'devices',
            key: 'id',
        },
        field: 'device_id'
    },
    soilMoistureThreshold: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 500,
        field: 'soil_moisture_threshold'
    },
    nutrientInterval: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 60000, // 60 seconds
        field: 'nutrient_interval'
    },
    nutrientDuration: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2000, // 2 seconds
        field: 'nutrient_duration'
    },
    waterPumpDuration: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3000, // 3 seconds
        field: 'water_pump_duration'
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active'
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        defaultValue: {},
    },
}, {
    sequelize: sequelize_2.default,
    modelName: 'SystemConfig',
    tableName: 'system_configs',
    timestamps: true,
    paranoid: true,
    underscored: true,
});
exports.default = SystemConfig;
