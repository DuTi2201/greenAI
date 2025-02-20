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
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportService = void 0;
const Device_1 = require("../../models/Device");
const SensorData_1 = require("../../models/SensorData");
const sequelize_1 = require("sequelize");
const date_fns_1 = require("date-fns");
const gemini_service_1 = require("../ai/gemini.service");
class ReportService {
    generateWeeklyStats() {
        return __awaiter(this, arguments, void 0, function* (date = new Date()) {
            const startDate = (0, date_fns_1.startOfWeek)(date, { weekStartsOn: 1 }); // Bắt đầu từ thứ 2
            const endDate = (0, date_fns_1.endOfWeek)(date, { weekStartsOn: 1 });
            const previousStartDate = (0, date_fns_1.subWeeks)(startDate, 1);
            const previousEndDate = (0, date_fns_1.subWeeks)(endDate, 1);
            // Lấy dữ liệu thiết bị
            const devices = yield Device_1.Device.findAll();
            const deviceActions = yield this.getDeviceActions(startDate, endDate);
            const previousDeviceActions = yield this.getDeviceActions(previousStartDate, previousEndDate);
            // Tính toán điện năng và nước tiêu thụ
            const energyUsage = yield this.calculateEnergyUsage(devices, deviceActions);
            const previousEnergyUsage = yield this.calculateEnergyUsage(devices, previousDeviceActions);
            const waterUsage = yield this.calculateWaterUsage(devices, deviceActions);
            const previousWaterUsage = yield this.calculateWaterUsage(devices, previousDeviceActions);
            // Tính toán hiệu suất cảm biến
            const sensorStats = yield this.calculateSensorStats(devices, startDate, endDate);
            // Dự đoán cho tuần tới
            const nextWeekPrediction = yield this.predictNextWeek(devices, [previousEnergyUsage.total, energyUsage.total], [previousWaterUsage.total, waterUsage.total]);
            // Tạo đề xuất
            const recommendations = yield this.generateRecommendations(devices, energyUsage, waterUsage, nextWeekPrediction);
            return {
                startDate,
                endDate,
                energyUsage: {
                    total: energyUsage.total,
                    byDevice: energyUsage.byDevice,
                    previousWeek: previousEnergyUsage.total,
                    prediction: nextWeekPrediction.energy,
                },
                waterUsage: {
                    total: waterUsage.total,
                    byPump: waterUsage.byPump,
                    previousWeek: previousWaterUsage.total,
                    prediction: nextWeekPrediction.water,
                },
                sensorStats,
                recommendations,
            };
        });
    }
    getDeviceActions(startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            // Lấy lịch sử hoạt động của thiết bị từ database
            // TODO: Implement device action logging
            return [];
        });
    }
    calculateEnergyUsage(devices, actions) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const energyUsage = {
                total: 0,
                byDevice: [],
            };
            for (const device of devices) {
                if (device.type !== 'sensor' && ((_a = device.metadata) === null || _a === void 0 ? void 0 : _a.power)) {
                    const deviceActions = actions.filter(a => a.deviceId === device.id);
                    const hoursActive = this.calculateActiveHours(deviceActions);
                    const powerUsage = device.calculateEnergyConsumption(hoursActive);
                    energyUsage.total += powerUsage;
                    energyUsage.byDevice.push({
                        deviceId: device.id,
                        deviceName: device.name,
                        powerUsage,
                        hoursActive,
                    });
                }
            }
            return energyUsage;
        });
    }
    calculateWaterUsage(devices, actions) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const waterUsage = {
                total: 0,
                byPump: [],
            };
            for (const device of devices) {
                if (device.type === Device_1.DeviceType.WATER_PUMP && ((_a = device.metadata) === null || _a === void 0 ? void 0 : _a.flowRate)) {
                    const pumpActions = actions.filter(a => a.deviceId === device.id);
                    const minutesActive = this.calculateActiveMinutes(pumpActions);
                    const liters = device.calculateWaterConsumption(minutesActive);
                    waterUsage.total += liters;
                    waterUsage.byPump.push({
                        pumpId: device.id,
                        pumpName: device.name,
                        liters,
                        hoursActive: minutesActive / 60,
                    });
                }
            }
            return waterUsage;
        });
    }
    calculateSensorStats(devices, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const stats = [];
            for (const device of devices) {
                if (device.type === 'sensor') {
                    const readings = yield SensorData_1.SensorData.count({
                        where: {
                            deviceId: device.id,
                            timestamp: {
                                [sequelize_1.Op.between]: [startDate, endDate],
                            },
                        },
                    });
                    // Tính uptime và accuracy dựa trên số lần đọc thành công
                    const expectedReadings = 24 * 7 * 60; // Mỗi phút trong 1 tuần
                    const uptime = (readings / expectedReadings) * 100;
                    stats.push({
                        sensorId: device.id,
                        sensorName: device.name,
                        uptime: Math.round(uptime * 10) / 10,
                        readings,
                        accuracy: 99.9, // TODO: Implement accuracy calculation
                    });
                }
            }
            return stats;
        });
    }
    predictNextWeek(devices, energyHistory, waterHistory) {
        return __awaiter(this, void 0, void 0, function* () {
            // Dự đoán đơn giản dựa trên xu hướng
            const energyTrend = (energyHistory[1] - energyHistory[0]) / energyHistory[0];
            const waterTrend = (waterHistory[1] - waterHistory[0]) / waterHistory[0];
            return {
                energy: energyHistory[1] * (1 + energyTrend),
                water: waterHistory[1] * (1 + waterTrend),
            };
        });
    }
    generateRecommendations(devices, energyUsage, waterUsage, prediction) {
        return __awaiter(this, void 0, void 0, function* () {
            const recommendations = [];
            // Kiểm tra thiết bị cần bảo trì
            const maintenanceDevices = devices.filter(d => {
                var _a, _b;
                const lastMaintenance = (_a = d.metadata) === null || _a === void 0 ? void 0 : _a.lastMaintenance;
                const maintenanceInterval = (_b = d.metadata) === null || _b === void 0 ? void 0 : _b.maintenanceInterval;
                if (!lastMaintenance || !maintenanceInterval)
                    return false;
                const nextMaintenance = new Date(lastMaintenance).getTime() + maintenanceInterval;
                return Date.now() > nextMaintenance;
            });
            if (maintenanceDevices.length > 0) {
                recommendations.push({
                    title: 'Bảo trì thiết bị',
                    description: `Các thiết bị sau cần được bảo trì: ${maintenanceDevices.map(d => d.name).join(', ')}`,
                    savings: {},
                });
            }
            // Kiểm tra tiêu thụ điện cao
            if (prediction.energy > energyUsage.total * 1.1) {
                recommendations.push({
                    title: 'Cảnh báo tiêu thụ điện',
                    description: 'Dự kiến tuần tới tiêu thụ điện tăng > 10%. Xem xét điều chỉnh lịch hoạt động thiết bị.',
                    savings: {
                        energy: prediction.energy - energyUsage.total,
                    },
                });
            }
            // Kiểm tra tiêu thụ nước cao
            if (prediction.water > waterUsage.total * 1.1) {
                recommendations.push({
                    title: 'Cảnh báo tiêu thụ nước',
                    description: 'Dự kiến tuần tới tiêu thụ nước tăng > 10%. Xem xét điều chỉnh lịch tưới.',
                    savings: {
                        water: prediction.water - waterUsage.total,
                    },
                });
            }
            // Sử dụng Gemini AI để phân tích và đưa ra đề xuất thông minh
            try {
                const aiRecommendations = yield gemini_service_1.geminiService.analyzeUsagePatterns({
                    energy: energyUsage,
                    water: waterUsage,
                    prediction,
                });
                recommendations.push(...aiRecommendations);
            }
            catch (error) {
                console.error('Error getting AI recommendations:', error);
            }
            return recommendations;
        });
    }
    calculateActiveHours(actions) {
        // TODO: Implement actual calculation based on device actions
        return 24 * 7 * 0.3; // Giả định hoạt động 30% thời gian trong tuần
    }
    calculateActiveMinutes(actions) {
        // TODO: Implement actual calculation based on device actions
        return 24 * 7 * 60 * 0.1; // Giả định hoạt động 10% thời gian trong tuần
    }
}
exports.reportService = new ReportService();
