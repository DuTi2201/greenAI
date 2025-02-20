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
exports.Device = exports.DeviceStatus = exports.DeviceType = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = __importDefault(require("../config/sequelize"));
var DeviceType;
(function (DeviceType) {
    DeviceType["LED"] = "led";
    DeviceType["FAN"] = "fan";
    DeviceType["WATER_PUMP"] = "water_pump";
    DeviceType["NUTRIENT_PUMP"] = "nutrient_pump";
    DeviceType["SENSOR"] = "sensor";
    DeviceType["WEMOS"] = "wemos";
    DeviceType["ARDUINO"] = "arduino";
})(DeviceType || (exports.DeviceType = DeviceType = {}));
var DeviceStatus;
(function (DeviceStatus) {
    DeviceStatus["ON"] = "on";
    DeviceStatus["OFF"] = "off";
    DeviceStatus["ERROR"] = "error";
    DeviceStatus["DISCONNECTED"] = "disconnected";
})(DeviceStatus || (exports.DeviceStatus = DeviceStatus = {}));
class Device extends sequelize_1.Model {
    // Tính toán điện năng tiêu thụ (kWh)
    calculateEnergyConsumption(hours) {
        var _a;
        if (!((_a = this.metadata) === null || _a === void 0 ? void 0 : _a.power))
            return 0;
        return (this.metadata.power * hours) / 1000;
    }
    // Tính toán lượng nước tiêu thụ (L)
    calculateWaterConsumption(minutes) {
        var _a;
        if (!((_a = this.metadata) === null || _a === void 0 ? void 0 : _a.flowRate))
            return 0;
        return this.metadata.flowRate * minutes;
    }
    // Kiểm tra thiết bị có đang online không
    isOnline() {
        var _a;
        if (!((_a = this.metadata) === null || _a === void 0 ? void 0 : _a.lastConnected))
            return false;
        const offlineThreshold = 1000 * 60; // 1 phút
        return Date.now() - new Date(this.metadata.lastConnected).getTime() < offlineThreshold;
    }
    // Cập nhật trạng thái kết nối
    updateConnectionStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isOnline()) {
                this.status = DeviceStatus.DISCONNECTED;
                yield this.save();
            }
        });
    }
}
exports.Device = Device;
Device.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(DeviceType)),
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(DeviceStatus)),
        allowNull: false,
        defaultValue: DeviceStatus.OFF,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    metadata: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
    },
    lastAction: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    createdBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
    },
}, {
    sequelize: sequelize_2.default,
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
});
exports.default = Device;
