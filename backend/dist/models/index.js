"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = exports.Advice = exports.Advisor = exports.User = exports.Alert = exports.SensorData = exports.Device = void 0;
const sequelize_1 = __importDefault(require("../config/sequelize"));
exports.sequelize = sequelize_1.default;
const Device_1 = require("./Device");
Object.defineProperty(exports, "Device", { enumerable: true, get: function () { return Device_1.Device; } });
const SensorData_1 = require("./SensorData");
Object.defineProperty(exports, "SensorData", { enumerable: true, get: function () { return SensorData_1.SensorData; } });
const Alert_1 = require("./Alert");
Object.defineProperty(exports, "Alert", { enumerable: true, get: function () { return Alert_1.Alert; } });
const User_1 = require("./User");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return User_1.User; } });
const Advisor_1 = require("./Advisor");
Object.defineProperty(exports, "Advisor", { enumerable: true, get: function () { return Advisor_1.Advisor; } });
const Advice_1 = require("./Advice");
Object.defineProperty(exports, "Advice", { enumerable: true, get: function () { return Advice_1.Advice; } });
// Khởi tạo các model
Advisor_1.Advisor.initModel(sequelize_1.default);
Advice_1.Advice.initModel(sequelize_1.default);
// Thiết lập các mối quan hệ
Device_1.Device.hasMany(SensorData_1.SensorData, {
    foreignKey: 'deviceId',
    onDelete: 'CASCADE'
});
SensorData_1.SensorData.belongsTo(Device_1.Device, { foreignKey: 'deviceId' });
Device_1.Device.hasMany(Alert_1.Alert, {
    foreignKey: 'deviceId',
    onDelete: 'CASCADE'
});
Alert_1.Alert.belongsTo(Device_1.Device, { foreignKey: 'deviceId' });
// Thêm quan hệ với User
Device_1.Device.belongsTo(User_1.User, {
    foreignKey: 'createdBy',
    as: 'creator'
});
Alert_1.Alert.belongsTo(User_1.User, {
    foreignKey: 'resolvedBy',
    as: 'resolver'
});
// Thêm quan hệ cho Advisor và Advice
Advisor_1.Advisor.belongsTo(User_1.User, { foreignKey: 'userId' });
Advisor_1.Advisor.hasMany(Advice_1.Advice, {
    foreignKey: 'advisorId',
    onDelete: 'CASCADE'
});
Advice_1.Advice.belongsTo(Advisor_1.Advisor, { foreignKey: 'advisorId' });
Advice_1.Advice.belongsTo(Device_1.Device, { foreignKey: 'deviceId' });
exports.default = {
    Device: Device_1.Device,
    SensorData: SensorData_1.SensorData,
    Alert: Alert_1.Alert,
    User: User_1.User,
    Advisor: Advisor_1.Advisor,
    Advice: Advice_1.Advice,
    sequelize: sequelize_1.default
};
