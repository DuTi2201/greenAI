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
exports.seedDemoData = seedDemoData;
const Device_1 = require("../models/Device");
const SensorData_1 = require("../models/SensorData");
const Alert_1 = require("../models/Alert");
const User_1 = require("../models/User");
const Advisor_1 = require("../models/Advisor");
const Advice_1 = require("../models/Advice");
const date_fns_1 = require("date-fns");
const uuid_1 = require("uuid");
const bcrypt_1 = __importDefault(require("bcrypt"));
function seedDemoData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Tạo người dùng demo
            const users = yield createUsers();
            console.log('Đã tạo người dùng demo');
            // Tạo thiết bị demo
            const devices = yield createDevices(users[0].id);
            console.log('Đã tạo thiết bị demo');
            // Tạo dữ liệu cảm biến trong 2 tuần
            const sensorDevice = devices.find(d => d.type === Device_1.DeviceType.SENSOR);
            if (sensorDevice) {
                yield createSensorData(sensorDevice.id);
                console.log('Đã tạo dữ liệu cảm biến demo');
            }
            // Tạo cảnh báo demo
            yield createAlerts(devices, users[0].id);
            console.log('Đã tạo cảnh báo demo');
            // Tạo tư vấn và lời khuyên demo
            yield createAdvisorData(users[0].id, sensorDevice === null || sensorDevice === void 0 ? void 0 : sensorDevice.id);
            console.log('Đã tạo tư vấn và lời khuyên demo');
            console.log('Đã tạo xong dữ liệu demo');
        }
        catch (error) {
            console.error('Lỗi khi tạo dữ liệu demo:', error);
            throw error;
        }
    });
}
function createUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        const users = [
            {
                email: 'admin@greenai.com',
                password: 'admin123',
                name: 'Admin',
                role: 'admin'
            },
            {
                email: 'user@greenai.com',
                password: 'user123',
                name: 'User',
                role: 'user'
            }
        ];
        // Hash mật khẩu trước khi tạo
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedUsers = yield Promise.all(users.map((user) => __awaiter(this, void 0, void 0, function* () {
            return (Object.assign(Object.assign({}, user), { password: yield bcrypt_1.default.hash(user.password, salt) }));
        })));
        return yield User_1.User.bulkCreate(hashedUsers);
    });
}
function createDevices(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const devices = [
            {
                name: 'Đèn LED chính',
                type: Device_1.DeviceType.LED,
                status: Device_1.DeviceStatus.OFF,
                isActive: true,
                metadata: {
                    power: 50, // 50W
                    operatingHours: {
                        start: '06:00',
                        end: '18:00'
                    }
                },
                createdBy: userId
            },
            {
                name: 'Quạt thông gió',
                type: Device_1.DeviceType.FAN,
                status: Device_1.DeviceStatus.OFF,
                isActive: true,
                metadata: {
                    power: 35, // 35W
                    operatingHours: {
                        start: '10:00',
                        end: '16:00'
                    }
                },
                createdBy: userId
            },
            {
                name: 'Máy bơm 1',
                type: Device_1.DeviceType.WATER_PUMP,
                status: Device_1.DeviceStatus.OFF,
                isActive: true,
                metadata: {
                    power: 100, // 100W
                    flowRate: 10, // 10L/phút
                    operatingHours: {
                        start: '07:00',
                        end: '07:30'
                    }
                },
                createdBy: userId
            },
            {
                name: 'Cảm biến môi trường',
                type: Device_1.DeviceType.SENSOR,
                status: Device_1.DeviceStatus.ON,
                isActive: true,
                metadata: {
                    sensorTypes: ['temperature', 'humidity', 'light', 'soilMoisture'],
                    readingInterval: 5 // 5 phút
                },
                createdBy: userId
            }
        ];
        const createdDevices = yield Device_1.Device.bulkCreate(devices);
        // Tạo lastAction cho mỗi thiết bị
        for (const device of createdDevices) {
            if (device.type !== Device_1.DeviceType.SENSOR) {
                const operatingHours = (_a = device.metadata) === null || _a === void 0 ? void 0 : _a.operatingHours;
                if (operatingHours) {
                    yield device.update({
                        lastAction: {
                            action: Device_1.DeviceStatus.ON,
                            timestamp: new Date(),
                            duration: getOperatingDuration(operatingHours),
                            userId
                        }
                    });
                }
            }
        }
        return createdDevices;
    });
}
function createSensorData(sensorId) {
    return __awaiter(this, void 0, void 0, function* () {
        const twoWeeksAgo = (0, date_fns_1.subDays)(new Date(), 14);
        const sensorData = [];
        // Tạo dữ liệu mỗi 5 phút trong 2 tuần
        for (let i = 0; i < 14 * 24 * 12; i++) {
            const timestamp = (0, date_fns_1.addHours)(twoWeeksAgo, i / 12);
            const hourOfDay = timestamp.getHours();
            // Mô phỏng dữ liệu theo thời gian trong ngày
            // Nhiệt độ không khí (°C): 18-32°C
            const temperature = 25 + Math.sin(hourOfDay / 24 * Math.PI * 2) * 7 + Math.random() * 2;
            // Độ ẩm không khí (%): 40-80%
            const humidity = 60 + Math.sin(hourOfDay / 24 * Math.PI * 2) * 20 + Math.random() * 5;
            // Cường độ ánh sáng (Lux): 0-100000 lux
            const light = hourOfDay >= 6 && hourOfDay <= 18 ?
                50000 + Math.sin((hourOfDay - 6) / 12 * Math.PI) * 30000 + Math.random() * 5000 :
                100 + Math.random() * 50;
            // Độ ẩm đất (%): 20-90%
            const soilMoisture = 55 + Math.sin(i / 288 * Math.PI * 2) * 35 + Math.random() * 5;
            sensorData.push({
                deviceId: sensorId,
                timestamp,
                temperature: Math.round(temperature * 10) / 10, // Làm tròn 1 chữ số thập phân
                humidity: Math.round(humidity * 10) / 10,
                light: Math.round(light),
                soilMoisture: Math.round(soilMoisture * 10) / 10,
                metadata: {
                    sensorType: 'environment',
                    calibrated: true,
                    units: {
                        temperature: '°C',
                        humidity: '%',
                        light: 'Lux',
                        soilMoisture: '%'
                    }
                }
            });
        }
        yield SensorData_1.SensorData.bulkCreate(sensorData);
    });
}
function createAlerts(devices, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const alerts = [
            {
                type: Alert_1.AlertType.ERROR,
                message: 'Máy bơm 1 không hoạt động',
                severity: Alert_1.AlertSeverity.HIGH,
                deviceId: ((_a = devices.find(d => d.type === Device_1.DeviceType.WATER_PUMP)) === null || _a === void 0 ? void 0 : _a.id) || '',
                status: Alert_1.AlertStatus.RESOLVED,
                metadata: {
                    errorCode: 'PUMP_ERROR_001'
                },
                resolvedBy: userId,
                resolvedAt: (0, date_fns_1.subDays)(new Date(), 9),
                createdAt: (0, date_fns_1.subDays)(new Date(), 10)
            },
            {
                type: Alert_1.AlertType.WARNING,
                message: 'Độ ẩm đất thấp',
                severity: Alert_1.AlertSeverity.MEDIUM,
                deviceId: ((_b = devices.find(d => d.type === Device_1.DeviceType.SENSOR)) === null || _b === void 0 ? void 0 : _b.id) || '',
                status: Alert_1.AlertStatus.ACTIVE,
                metadata: {
                    value: 30,
                    threshold: 50
                },
                createdAt: (0, date_fns_1.subDays)(new Date(), 3)
            },
            {
                type: Alert_1.AlertType.INFO,
                message: 'Cập nhật firmware thành công',
                severity: Alert_1.AlertSeverity.LOW,
                deviceId: ((_c = devices.find(d => d.type === Device_1.DeviceType.SENSOR)) === null || _c === void 0 ? void 0 : _c.id) || '',
                status: Alert_1.AlertStatus.RESOLVED,
                metadata: {
                    version: '1.2.0'
                },
                resolvedBy: userId,
                resolvedAt: (0, date_fns_1.subDays)(new Date(), 6),
                createdAt: (0, date_fns_1.subDays)(new Date(), 7)
            }
        ];
        yield Alert_1.Alert.bulkCreate(alerts);
    });
}
function createAdvisorData(userId, deviceId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!deviceId)
            return;
        // Tạo advisor
        const advisorData = {
            userId,
            sensorData: {
                temperature: 28,
                humidity: 65,
                light: 450,
                soilMoisture: 40
            },
            healthScore: 75,
            recommendations: [],
            analysis: 'Các thông số môi trường ở mức trung bình, cần cải thiện độ ẩm đất.',
            timestamp: (0, date_fns_1.subDays)(new Date(), 2)
        };
        const advisor = yield Advisor_1.Advisor.create(advisorData);
        // Cập nhật recommendations sau khi tạo
        const recommendations = [
            {
                id: (0, uuid_1.v4)(),
                title: 'Tăng độ ẩm đất',
                description: 'Độ ẩm đất hiện tại thấp hơn mức tối ưu. Nên bật hệ thống tưới trong 15 phút.',
                device: 'pump',
                action: 'on',
                duration: 15
            },
            {
                id: (0, uuid_1.v4)(),
                title: 'Giảm cường độ ánh sáng',
                description: 'Cường độ ánh sáng hiện tại cao hơn mức tối ưu. Nên tắt đèn LED trong 30 phút.',
                device: 'led',
                action: 'off',
                duration: 30,
                appliedAt: new Date(),
                success: true
            }
        ];
        yield advisor.update({ recommendations });
        // Tạo các lời khuyên
        const advices = [
            {
                advisorId: advisor.id,
                deviceId,
                title: 'Tăng độ ẩm đất',
                description: 'Độ ẩm đất hiện tại thấp hơn mức tối ưu. Nên bật hệ thống tưới trong 15 phút.',
                action: 'on',
                duration: 15,
                status: 'pending',
            },
            {
                advisorId: advisor.id,
                deviceId,
                title: 'Giảm cường độ ánh sáng',
                description: 'Cường độ ánh sáng hiện tại cao hơn mức tối ưu. Nên tắt đèn LED trong 30 phút.',
                action: 'off',
                duration: 30,
                status: 'applied',
                appliedAt: new Date(),
                success: true
            }
        ];
        yield Advice_1.Advice.bulkCreate(advices);
    });
}
function getOperatingDuration(hours) {
    const [startHour, startMin] = hours.start.split(':').map(Number);
    const [endHour, endMin] = hours.end.split(':').map(Number);
    return ((endHour - startHour) * 60 + (endMin - startMin));
}
