"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const server_1 = require("../../server");
const error_1 = require("../../middleware/error");
const queue_1 = require("../../lib/queue");
exports.router = (0, express_1.Router)();
exports.router.use(auth_1.protect);
exports.router.get('/:deviceId', async (req, res, next) => {
    try {
        const device = await server_1.prisma.garden.findUnique({
            where: {
                id: req.params.deviceId,
                userId: req.user.id
            }
        });
        if (!device) {
            return next(new error_1.AppError('Device not found', 404));
        }
        const reports = await server_1.prisma.aIReport.findMany({
            where: { gardenId: device.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            status: 'success',
            data: { reports }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.router.post('/:deviceId', async (req, res, next) => {
    try {
        const { reportType, startDate, endDate } = req.body;
        const device = await server_1.prisma.garden.findUnique({
            where: {
                id: req.params.deviceId,
                userId: req.user.id
            }
        });
        if (!device) {
            return next(new error_1.AppError('Device not found', 404));
        }
        await queue_1.reportQueue.add('generate-report', {
            deviceId: device.id,
            reportType,
            startDate,
            endDate,
            userId: req.user.id
        });
        res.status(202).json({
            status: 'success',
            message: 'Report generation started'
        });
    }
    catch (error) {
        next(error);
    }
});
exports.router.get('/:deviceId/schedules', async (req, res, next) => {
    try {
        const device = await server_1.prisma.garden.findUnique({
            where: {
                id: req.params.deviceId,
                userId: req.user.id
            }
        });
        if (!device) {
            return next(new error_1.AppError('Device not found', 404));
        }
        const schedules = await server_1.prisma.reportSchedule.findMany({
            where: { gardenId: device.id }
        });
        res.json({
            status: 'success',
            data: { schedules }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.router.post('/:deviceId/schedules', async (req, res, next) => {
    try {
        const { frequency, dayOfWeek, timeOfDay, emailRecipient, reportType } = req.body;
        const device = await server_1.prisma.garden.findUnique({
            where: {
                id: req.params.deviceId,
                userId: req.user.id
            }
        });
        if (!device) {
            return next(new error_1.AppError('Device not found', 404));
        }
        const schedule = await server_1.prisma.reportSchedule.create({
            data: {
                userId: req.user.id,
                gardenId: device.id,
                frequency,
                dayOfWeek,
                timeOfDay: new Date(timeOfDay),
                emailRecipient,
                reportType,
                isActive: true
            }
        });
        res.status(201).json({
            status: 'success',
            data: { schedule }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.router.patch('/:deviceId/schedules/:scheduleId', async (req, res, next) => {
    try {
        const { frequency, dayOfWeek, timeOfDay, emailRecipient, isActive, reportType } = req.body;
        const device = await server_1.prisma.garden.findUnique({
            where: {
                id: req.params.deviceId,
                userId: req.user.id
            }
        });
        if (!device) {
            return next(new error_1.AppError('Device not found', 404));
        }
        const schedule = await server_1.prisma.reportSchedule.update({
            where: {
                id: req.params.scheduleId,
                gardenId: device.id
            },
            data: {
                frequency,
                dayOfWeek,
                timeOfDay: timeOfDay ? new Date(timeOfDay) : undefined,
                emailRecipient,
                reportType,
                isActive
            }
        });
        res.json({
            status: 'success',
            data: { schedule }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.router.delete('/:deviceId/schedules/:scheduleId', async (req, res, next) => {
    try {
        const device = await server_1.prisma.garden.findUnique({
            where: {
                id: req.params.deviceId,
                userId: req.user.id
            }
        });
        if (!device) {
            return next(new error_1.AppError('Device not found', 404));
        }
        await server_1.prisma.reportSchedule.delete({
            where: {
                id: req.params.scheduleId,
                gardenId: device.id
            }
        });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=reports.js.map