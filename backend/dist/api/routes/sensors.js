"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const singleton_1 = require("../../singleton");
const error_1 = require("../../middleware/error");
exports.router = (0, express_1.Router)();
exports.router.use(auth_1.protect);
exports.router.get('/:deviceId', async (req, res, next) => {
    try {
        const device = await singleton_1.prisma.garden.findUnique({
            where: {
                id: req.params.deviceId,
                userId: req.user.id
            }
        });
        if (!device) {
            return next(new error_1.AppError('Device not found', 404));
        }
        const sensorData = await singleton_1.prisma.sensorData.findMany({
            where: { gardenId: device.id },
            orderBy: { recordedAt: 'desc' }
        });
        res.json({
            status: 'success',
            data: { sensorData }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.router.post('/:deviceId', async (req, res, next) => {
    try {
        const { temperature, humidity, soilMoisture, lightLevel } = req.body;
        const device = await singleton_1.prisma.garden.findUnique({
            where: {
                id: req.params.deviceId,
                userId: req.user.id
            }
        });
        if (!device) {
            return next(new error_1.AppError('Device not found', 404));
        }
        const sensorData = await singleton_1.prisma.sensorData.create({
            data: {
                gardenId: device.id,
                temperature,
                humidity,
                soilMoisture,
                lightLevel
            }
        });
        await singleton_1.prisma.garden.update({
            where: { id: device.id },
            data: { lastConnected: new Date() }
        });
        res.status(201).json({
            status: 'success',
            data: { sensorData }
        });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=sensors.js.map