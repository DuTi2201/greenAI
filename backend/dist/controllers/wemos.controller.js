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
exports.WemosController = void 0;
const index_1 = require("../index");
const logger_1 = require("../utils/logger");
const Device_1 = require("../models/Device");
const SensorData_1 = __importDefault(require("../models/SensorData"));
const SystemConfig_1 = __importDefault(require("../models/SystemConfig"));
const cache_service_1 = require("../services/cache.service");
class WemosController {
    constructor() {
        this.CACHE_TTL = 5000; // 5 giây
        this.cache = cache_service_1.CacheService.getInstance();
    }
    // Nhận và lưu dữ liệu cảm biến
    receiveSensorData(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sensorData = req.body;
                // Tìm hoặc tạo Wemos device
                const cachedDevice = this.cache.get('wemos_device');
                let device;
                if (cachedDevice) {
                    device = cachedDevice;
                }
                else {
                    [device] = yield Device_1.Device.findOrCreate({
                        where: { type: Device_1.DeviceType.WEMOS },
                        defaults: {
                            name: 'Wemos D1',
                            type: Device_1.DeviceType.WEMOS,
                            status: Device_1.DeviceStatus.ON,
                            metadata: {
                                description: 'Wemos D1 WiFi Controller',
                                location: 'Garden'
                            }
                        }
                    });
                    this.cache.set('wemos_device', device, this.CACHE_TTL);
                }
                // Lưu dữ liệu cảm biến
                const newSensorData = yield SensorData_1.default.create({
                    deviceId: device.id,
                    timestamp: new Date(),
                    temperature: sensorData.temperature,
                    humidity: sensorData.humidity,
                    soilMoisture: sensorData.soil_moisture,
                    light: sensorData.light_intensity,
                    waterPumpState: sensorData.water_pump_state,
                    nutrientPumpState: sensorData.nutrient_pump_state
                });
                // Cập nhật cache dữ liệu mới nhất
                this.cache.set('latest_sensor_data', newSensorData, this.CACHE_TTL);
                // Broadcast dữ liệu qua WebSocket
                index_1.io.emit('sensor_update', sensorData);
                logger_1.logger.info('Received sensor data:', sensorData);
                res.status(200).json({ message: 'Data received successfully' });
            }
            catch (error) {
                logger_1.logger.error('Error receiving sensor data:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    // Trả về lệnh điều khiển
    getControlCommands(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Kiểm tra cache cho device states
                const cachedCommands = this.cache.get('device_commands');
                if (cachedCommands) {
                    res.status(200).json(cachedCommands);
                    return;
                }
                const device = yield Device_1.Device.findOne({
                    where: { type: Device_1.DeviceType.WEMOS }
                });
                if (!device) {
                    res.status(404).json({ error: 'Wemos device not found' });
                    return;
                }
                // Lấy trạng thái các thiết bị
                const waterPump = yield Device_1.Device.findOne({ where: { type: Device_1.DeviceType.WATER_PUMP } });
                const nutrientPump = yield Device_1.Device.findOne({ where: { type: Device_1.DeviceType.NUTRIENT_PUMP } });
                const led = yield Device_1.Device.findOne({ where: { type: Device_1.DeviceType.LED } });
                const fan = yield Device_1.Device.findOne({ where: { type: Device_1.DeviceType.FAN } });
                const commands = {
                    pump1: (waterPump === null || waterPump === void 0 ? void 0 : waterPump.status) === Device_1.DeviceStatus.ON,
                    pump2: (nutrientPump === null || nutrientPump === void 0 ? void 0 : nutrientPump.status) === Device_1.DeviceStatus.ON,
                    led: (led === null || led === void 0 ? void 0 : led.status) === Device_1.DeviceStatus.ON,
                    fan: (fan === null || fan === void 0 ? void 0 : fan.status) === Device_1.DeviceStatus.ON
                };
                // Lưu vào cache
                this.cache.set('device_commands', commands, this.CACHE_TTL);
                res.status(200).json(commands);
            }
            catch (error) {
                logger_1.logger.error('Error getting control commands:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    // Cập nhật cấu hình ngưỡng
    updateConfig(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const config = req.body;
                // Xóa cache cấu hình cũ
                this.cache.delete('system_config');
                const device = yield Device_1.Device.findOne({
                    where: { type: Device_1.DeviceType.WEMOS }
                });
                if (!device) {
                    res.status(404).json({ error: 'Wemos device not found' });
                    return;
                }
                // Cập nhật hoặc tạo mới cấu hình
                const [systemConfig] = yield SystemConfig_1.default.upsert({
                    deviceId: device.id,
                    soilMoistureThreshold: config.soil_moisture_threshold,
                    nutrientInterval: config.nutrient_interval,
                    nutrientDuration: config.nutrient_duration,
                    waterPumpDuration: config.water_pump_duration
                });
                // Lưu cấu hình mới vào cache
                this.cache.set('system_config', systemConfig, this.CACHE_TTL);
                logger_1.logger.info('Updated system config:', config);
                res.status(200).json({ message: 'Config updated successfully' });
            }
            catch (error) {
                logger_1.logger.error('Error updating config:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
}
exports.WemosController = WemosController;
