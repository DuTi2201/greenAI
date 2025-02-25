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
        const rules = await singleton_1.prisma.automationRule.findMany({
            where: {
                gardenId: device.id
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json({
            status: 'success',
            data: { rules }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.router.post('/:deviceId', async (req, res, next) => {
    try {
        const { sensorType, conditionOperator, thresholdValue, actionDevice, actionStatus } = req.body;
        const device = await singleton_1.prisma.garden.findUnique({
            where: {
                id: req.params.deviceId,
                userId: req.user.id
            }
        });
        if (!device) {
            return next(new error_1.AppError('Device not found', 404));
        }
        if (!sensorType || !conditionOperator || !actionDevice) {
            return next(new error_1.AppError('Missing required fields', 400));
        }
        const rule = await singleton_1.prisma.automationRule.create({
            data: {
                gardenId: device.id,
                sensorType,
                conditionOperator,
                thresholdValue,
                actionDevice,
                actionStatus,
                isActive: true
            }
        });
        res.status(201).json({
            status: 'success',
            data: { rule }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.router.patch('/:deviceId/rules/:ruleId', async (req, res, next) => {
    try {
        const { sensorType, conditionOperator, thresholdValue, actionDevice, actionStatus, isActive } = req.body;
        const device = await singleton_1.prisma.garden.findUnique({
            where: {
                id: req.params.deviceId,
                userId: req.user.id
            }
        });
        if (!device) {
            return next(new error_1.AppError('Device not found', 404));
        }
        const rule = await singleton_1.prisma.automationRule.update({
            where: {
                id: req.params.ruleId,
                gardenId: device.id
            },
            data: {
                sensorType,
                conditionOperator,
                thresholdValue,
                actionDevice,
                actionStatus,
                isActive
            }
        });
        res.json({
            status: 'success',
            data: { rule }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.router.delete('/:deviceId/rules/:ruleId', async (req, res, next) => {
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
        await singleton_1.prisma.automationRule.delete({
            where: {
                id: req.params.ruleId,
                gardenId: device.id
            }
        });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=automation.js.map