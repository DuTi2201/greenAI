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
exports.controlDevice = exports.deleteDevice = exports.updateDevice = exports.createDevice = exports.getDeviceById = exports.getAllDevices = void 0;
const Device_1 = require("../models/Device");
const SensorData_1 = require("../models/SensorData");
const Alert_1 = require("../models/Alert");
const getAllDevices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const devices = yield Device_1.Device.findAll({
            order: [['created_at', 'DESC']],
        });
        res.json(devices);
    }
    catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getAllDevices = getAllDevices;
const getDeviceById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const device = yield Device_1.Device.findByPk(req.params.id, {
            include: [
                {
                    model: SensorData_1.SensorData,
                    limit: 100,
                    order: [['timestamp', 'DESC']],
                },
                {
                    model: Alert_1.Alert,
                    where: { status: 'active' },
                    required: false,
                },
            ],
        });
        if (!device) {
            res.status(404).json({ error: 'Device not found' });
            return;
        }
        res.json(device);
    }
    catch (error) {
        console.error('Error fetching device:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getDeviceById = getDeviceById;
const createDevice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const device = yield Device_1.Device.create(req.body);
        res.status(201).json(device);
    }
    catch (error) {
        console.error('Error creating device:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createDevice = createDevice;
const updateDevice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const device = yield Device_1.Device.findByPk(req.params.id);
        if (!device) {
            res.status(404).json({ error: 'Device not found' });
            return;
        }
        yield device.update(req.body);
        res.json(device);
    }
    catch (error) {
        console.error('Error updating device:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.updateDevice = updateDevice;
const deleteDevice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const device = yield Device_1.Device.findByPk(req.params.id);
        if (!device) {
            res.status(404).json({ error: 'Device not found' });
            return;
        }
        yield device.destroy();
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting device:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.deleteDevice = deleteDevice;
const controlDevice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { action } = req.body;
        // Validate action
        if (action !== 'on' && action !== 'off') {
            res.status(400).json({ error: 'Invalid action. Must be "on" or "off"' });
            return;
        }
        const device = yield Device_1.Device.findByPk(id);
        if (!device) {
            res.status(404).json({ error: 'Device not found' });
            return;
        }
        if (!device.isActive) {
            res.status(400).json({ error: 'Device is not active' });
            return;
        }
        // Cập nhật trạng thái thiết bị trong database
        yield device.update({
            status: action,
            lastAction: {
                action,
                timestamp: new Date(),
                userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            },
        });
        // Trả về thông tin thiết bị đã cập nhật
        res.json(yield device.reload());
    }
    catch (error) {
        console.error('Error controlling device:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});
exports.controlDevice = controlDevice;
