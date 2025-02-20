"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SensorData = void 0;
const sequelize_1 = require("sequelize");
const Device_1 = require("./Device");
const sequelize_2 = __importDefault(require("../config/sequelize"));
class SensorData extends sequelize_1.Model {
    static getLatest(deviceName) {
        return __awaiter(this, void 0, void 0, function* () {
            const device = yield Device_1.Device.findOne({
                where: { name: deviceName }
            });
            if (!device) {
                return null;
            }
            return this.findOne({
                where: { deviceId: device.id },
                order: [['timestamp', 'DESC']],
            });
        });
    }
    static getDataInRange(deviceId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findAll({
                where: {
                    deviceId,
                    timestamp: {
                        [sequelize_1.Op.between]: [startDate, endDate],
                    },
                },
                order: [['timestamp', 'DESC']],
            });
        });
    }
    // Lấy dữ liệu theo khoảng thời gian và loại cảm biến
    static getDataByType(deviceId, sensorType, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findAll({
                where: {
                    deviceId,
                    timestamp: {
                        [sequelize_1.Op.between]: [startDate, endDate],
                    },
                    'metadata.sensorType': sensorType
                },
                order: [['timestamp', 'DESC']],
            });
        });
    }
    // Tính giá trị trung bình trong khoảng thời gian
    static getAverage(deviceId, field, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.findOne({
                where: {
                    deviceId,
                    timestamp: {
                        [sequelize_1.Op.between]: [startDate, endDate],
                    },
                },
                attributes: [
                    [sequelize_2.default.fn('AVG', sequelize_2.default.col(field)), 'average']
                ],
            });
            return (result === null || result === void 0 ? void 0 : result.getDataValue('average')) || 0;
        });
    }
    // Kiểm tra giá trị có vượt ngưỡng không
    isThresholdExceeded(thresholds) {
        const checkField = (field, threshold) => {
            const value = this[field];
            if (typeof value === 'number') {
                return value < threshold.min || value > threshold.max;
            }
            return false;
        };
        return Object.entries(thresholds).some(([field, threshold]) => checkField(field, threshold));
    }
}
exports.SensorData = SensorData;
SensorData.init({
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
    timestamp: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    temperature: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        validate: {
            min: -50,
            max: 100
        }
    },
    humidity: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        validate: {
            min: 0,
            max: 100
        }
    },
    light: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        validate: {
            min: 0,
            max: 1023
        }
    },
    soilMoisture: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
        validate: {
            min: 0,
            max: 1023
        },
        field: 'soil_moisture'
    },
    waterPumpState: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'water_pump_state'
    },
    nutrientPumpState: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'nutrient_pump_state'
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        defaultValue: {},
    },
}, {
    sequelize: sequelize_2.default,
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
});
exports.default = SensorData;
