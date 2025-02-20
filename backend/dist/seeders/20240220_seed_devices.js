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
exports.up = up;
exports.down = down;
const uuid_1 = require("uuid");
const Device_1 = require("../models/Device");
function up(queryInterface) {
    return __awaiter(this, void 0, void 0, function* () {
        const now = new Date();
        // Tạo Arduino device
        const arduinoId = (0, uuid_1.v4)();
        const wemosId = (0, uuid_1.v4)();
        const waterPumpId = (0, uuid_1.v4)();
        const nutrientPumpId = (0, uuid_1.v4)();
        const ledId = (0, uuid_1.v4)();
        const fanId = (0, uuid_1.v4)();
        yield queryInterface.bulkInsert('devices', [
            {
                id: arduinoId,
                name: 'Arduino Uno R3',
                type: Device_1.DeviceType.ARDUINO,
                status: Device_1.DeviceStatus.ON,
                is_active: true,
                metadata: {
                    description: 'Main controller',
                    firmwareVersion: '1.0.0',
                    location: 'Garden',
                    manufacturer: 'Arduino',
                    model: 'Uno R3',
                    installDate: now,
                    maintenanceInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
                    lastMaintenance: now
                },
                created_at: now,
                updated_at: now
            },
            {
                id: wemosId,
                name: 'Wemos D1',
                type: Device_1.DeviceType.WEMOS,
                status: Device_1.DeviceStatus.ON,
                is_active: true,
                metadata: {
                    description: 'WiFi controller',
                    ipAddress: '192.168.1.100',
                    macAddress: '00:11:22:33:44:55',
                    firmwareVersion: '1.0.0',
                    location: 'Garden',
                    manufacturer: 'Wemos',
                    model: 'D1',
                    installDate: now,
                    maintenanceInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
                    lastMaintenance: now,
                    autoMode: true
                },
                created_at: now,
                updated_at: now
            },
            {
                id: waterPumpId,
                name: 'Water Pump',
                type: Device_1.DeviceType.WATER_PUMP,
                status: Device_1.DeviceStatus.OFF,
                is_active: true,
                metadata: {
                    description: 'Main water pump',
                    power: 35, // 35W
                    flowRate: 1.5, // 1.5L/min
                    manufacturer: 'Generic',
                    model: 'WP-001',
                    installDate: now,
                    maintenanceInterval: 90 * 24 * 60 * 60 * 1000, // 90 days
                    lastMaintenance: now,
                    operatingHours: {
                        start: '06:00',
                        end: '18:00'
                    }
                },
                created_at: now,
                updated_at: now
            },
            {
                id: nutrientPumpId,
                name: 'Nutrient Pump',
                type: Device_1.DeviceType.NUTRIENT_PUMP,
                status: Device_1.DeviceStatus.OFF,
                is_active: true,
                metadata: {
                    description: 'Nutrient solution pump',
                    power: 25, // 25W
                    flowRate: 0.8, // 0.8L/min
                    manufacturer: 'Generic',
                    model: 'NP-001',
                    installDate: now,
                    maintenanceInterval: 60 * 24 * 60 * 60 * 1000, // 60 days
                    lastMaintenance: now,
                    operatingHours: {
                        start: '08:00',
                        end: '16:00'
                    }
                },
                created_at: now,
                updated_at: now
            },
            {
                id: ledId,
                name: 'LED Light',
                type: Device_1.DeviceType.LED,
                status: Device_1.DeviceStatus.OFF,
                is_active: true,
                metadata: {
                    description: 'Grow LED light',
                    power: 45, // 45W
                    manufacturer: 'Generic',
                    model: 'GL-001',
                    installDate: now,
                    maintenanceInterval: 180 * 24 * 60 * 60 * 1000, // 180 days
                    lastMaintenance: now,
                    operatingHours: {
                        start: '06:00',
                        end: '18:00'
                    }
                },
                created_at: now,
                updated_at: now
            },
            {
                id: fanId,
                name: 'Ventilation Fan',
                type: Device_1.DeviceType.FAN,
                status: Device_1.DeviceStatus.OFF,
                is_active: true,
                metadata: {
                    description: 'Ventilation fan',
                    power: 30, // 30W
                    manufacturer: 'Generic',
                    model: 'VF-001',
                    installDate: now,
                    maintenanceInterval: 90 * 24 * 60 * 60 * 1000, // 90 days
                    lastMaintenance: now,
                    operatingHours: {
                        start: '06:00',
                        end: '18:00'
                    }
                },
                created_at: now,
                updated_at: now
            }
        ]);
        // Tạo dữ liệu sensor mẫu
        const sensorData = [];
        for (let i = 0; i < 24; i++) {
            const timestamp = new Date(now.getTime() - i * 3600000); // Mỗi giờ một bản ghi
            sensorData.push({
                id: (0, uuid_1.v4)(),
                device_id: arduinoId,
                timestamp,
                temperature: 25 + Math.random() * 10 - 5, // 20-30°C
                humidity: 60 + Math.random() * 20 - 10, // 50-70%
                light: Math.floor(Math.random() * 1024), // 0-1023
                soil_moisture: Math.floor(300 + Math.random() * 400), // 300-700
                water_pump_state: Math.random() > 0.8, // 20% chance ON
                nutrient_pump_state: Math.random() > 0.9, // 10% chance ON
                metadata: {
                    sensorType: 'DHT22',
                    location: 'Garden',
                    calibrated: true,
                    calibrationDate: now,
                    accuracy: 0.5,
                    unit: '°C/%/lux/%'
                },
                created_at: timestamp,
                updated_at: timestamp
            });
        }
        yield queryInterface.bulkInsert('sensor_data', sensorData);
    });
}
function down(queryInterface) {
    return __awaiter(this, void 0, void 0, function* () {
        // Xóa tất cả dữ liệu mẫu
        yield queryInterface.bulkDelete('sensor_data', {});
        yield queryInterface.bulkDelete('devices', {});
    });
}
