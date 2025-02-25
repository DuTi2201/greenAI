"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceService = void 0;
const server_1 = require("../server");
const error_1 = require("../middleware/error");
exports.deviceService = {
    async getAllDevices(userId) {
        return server_1.prisma.garden.findMany({
            where: { userId },
            include: {
                deviceStatus: {
                    take: 1,
                    orderBy: { updatedAt: 'desc' }
                }
            }
        });
    },
    async getDevice(id, userId) {
        const device = await server_1.prisma.garden.findUnique({
            where: {
                id,
                userId
            },
            include: {
                deviceStatus: {
                    take: 1,
                    orderBy: { updatedAt: 'desc' }
                },
                sensorData: {
                    take: 1,
                    orderBy: { recordedAt: 'desc' }
                }
            }
        });
        if (!device) {
            throw new error_1.AppError('Device not found', 404);
        }
        return device;
    },
    async createDevice(data) {
        const existingDevice = await server_1.prisma.garden.findUnique({
            where: { wemosSerial: data.wemosSerial }
        });
        if (existingDevice) {
            throw new error_1.AppError('Device with this serial already exists', 400);
        }
        return server_1.prisma.garden.create({
            data: Object.assign(Object.assign({}, data), { apiKey: Math.random().toString(36).substring(2, 15), status: 'active' })
        });
    },
    async updateDevice(id, userId, data) {
        await this.getDevice(id, userId);
        return server_1.prisma.garden.update({
            where: { id },
            data
        });
    },
    async deleteDevice(id, userId) {
        await this.getDevice(id, userId);
        await server_1.prisma.garden.delete({
            where: { id }
        });
    },
    async controlDevice(id, userId, data) {
        await this.getDevice(id, userId);
        return server_1.prisma.deviceStatus.create({
            data: Object.assign({ gardenId: id }, data)
        });
    }
};
//# sourceMappingURL=device.js.map