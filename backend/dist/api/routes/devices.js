"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const device_1 = require("../../services/device");
const error_1 = require("../../middleware/error");
exports.router = (0, express_1.Router)();
exports.router.use(auth_1.protect);
exports.router.get('/', async (req, res, next) => {
    try {
        const devices = await device_1.deviceService.getAllDevices(req.user.id);
        res.json({
            status: 'success',
            data: { devices }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.router.get('/:id', async (req, res, next) => {
    try {
        const device = await device_1.deviceService.getDevice(req.params.id, req.user.id);
        res.json({
            status: 'success',
            data: { device }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.router.post('/', async (req, res, next) => {
    try {
        const { wemosSerial, name, location } = req.body;
        if (!wemosSerial || !name) {
            throw new error_1.AppError('Missing required fields', 400);
        }
        const device = await device_1.deviceService.createDevice({
            userId: req.user.id,
            wemosSerial,
            name,
            location
        });
        res.status(201).json({
            status: 'success',
            data: { device }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.router.patch('/:id', async (req, res, next) => {
    try {
        const { name, location, status } = req.body;
        const device = await device_1.deviceService.updateDevice(req.params.id, req.user.id, {
            name,
            location,
            status
        });
        res.json({
            status: 'success',
            data: { device }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.router.delete('/:id', async (req, res, next) => {
    try {
        await device_1.deviceService.deleteDevice(req.params.id, req.user.id);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
exports.router.post('/:id/control', async (req, res, next) => {
    try {
        const { fanStatus, ledStatus, nutrientPumpStatus, waterPumpStatus } = req.body;
        const deviceStatus = await device_1.deviceService.controlDevice(req.params.id, req.user.id, {
            fanStatus,
            ledStatus,
            nutrientPumpStatus,
            waterPumpStatus
        });
        res.json({
            status: 'success',
            data: { deviceStatus }
        });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=devices.js.map