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
exports.createSensorData = exports.getSensorData = exports.getLatestSensorData = void 0;
const SensorData_1 = require("../models/SensorData");
const Device_1 = require("../models/Device");
const Alert_1 = require("../models/Alert");
const thresholds = {
    temperature: { min: 20, max: 30 },
    humidity: { min: 60, max: 80 },
    soilMoisture: { min: 50, max: 70 },
    light: { min: 400, max: 600 },
};
const getLatestSensorData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield SensorData_1.SensorData.getLatest('main-sensor');
        if (!data) {
            res.status(404).json({ error: 'No sensor data available' });
            return;
        }
        // Chuyển đổi dữ liệu theo format frontend cần
        res.json({
            temperature: data.temperature,
            humidity: data.humidity,
            soilMoisture: data.soilMoisture,
            light: data.light,
            timestamp: data.timestamp,
        });
    }
    catch (error) {
        console.error('Error fetching latest sensor data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getLatestSensorData = getLatestSensorData;
const getSensorData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield SensorData_1.SensorData.findAll({
            order: [['timestamp', 'DESC']],
            limit: 100,
        });
        res.json(data);
    }
    catch (error) {
        console.error('Error fetching sensor data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getSensorData = getSensorData;
const createSensorData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { deviceId, temperature, humidity, soilMoisture, light } = req.body;
        // Validate device exists
        const device = yield Device_1.Device.findByPk(deviceId);
        if (!device) {
            res.status(404).json({ error: 'Device not found' });
            return;
        }
        // Create sensor data
        const data = yield SensorData_1.SensorData.create({
            deviceId,
            temperature,
            humidity,
            soilMoisture,
            light,
            timestamp: new Date(),
            metadata: {
                source: 'sensor',
                calibrated: true,
            },
        });
        // Check thresholds and create alerts if needed
        const checkAndCreateAlert = (value, type, deviceId) => __awaiter(void 0, void 0, void 0, function* () {
            const threshold = thresholds[type];
            if (value < threshold.min || value > threshold.max) {
                yield Alert_1.Alert.create({
                    deviceId,
                    type: 'warning',
                    message: `${type} (${value}) is outside normal range (${threshold.min}-${threshold.max})`,
                    severity: value < threshold.min ? 'low' : 'high',
                    status: 'active',
                    metadata: {
                        sensorValue: value,
                        threshold: threshold,
                        sensorType: type,
                    },
                });
            }
        });
        // Check each sensor value
        yield Promise.all([
            checkAndCreateAlert(temperature, 'temperature', deviceId),
            checkAndCreateAlert(humidity, 'humidity', deviceId),
            checkAndCreateAlert(soilMoisture, 'soilMoisture', deviceId),
            checkAndCreateAlert(light, 'light', deviceId),
        ]);
        res.status(201).json(data);
    }
    catch (error) {
        console.error('Error creating sensor data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createSensorData = createSensorData;
