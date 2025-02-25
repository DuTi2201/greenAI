"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocket = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const server_1 = require("../server");
const setupWebSocket = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback-secret');
            const user = await server_1.prisma.user.findUnique({
                where: { id: decoded.id }
            });
            if (!user) {
                return next(new Error('User not found'));
            }
            socket.userId = user.id;
            socket.deviceRooms = new Set();
            next();
        }
        catch (error) {
            next(new Error('Authentication error'));
        }
    });
    io.on('connection', (socket) => {
        const authenticatedSocket = socket;
        console.log('Client connected:', authenticatedSocket.id);
        authenticatedSocket.on('join-device', async (deviceId) => {
            try {
                const device = await server_1.prisma.garden.findUnique({
                    where: {
                        id: deviceId,
                        userId: authenticatedSocket.userId
                    }
                });
                if (!device) {
                    authenticatedSocket.emit('error', 'Device not found or access denied');
                    return;
                }
                const room = `device:${deviceId}`;
                authenticatedSocket.join(room);
                authenticatedSocket.deviceRooms.add(room);
                console.log(`Client ${authenticatedSocket.id} joined room ${room}`);
            }
            catch (error) {
                console.error('Error joining device room:', error);
                authenticatedSocket.emit('error', 'Failed to join device room');
            }
        });
        authenticatedSocket.on('leave-device', (deviceId) => {
            const room = `device:${deviceId}`;
            authenticatedSocket.leave(room);
            authenticatedSocket.deviceRooms.delete(room);
            console.log(`Client ${authenticatedSocket.id} left room ${room}`);
        });
        authenticatedSocket.on('sensor-data', async (data) => {
            try {
                const device = await server_1.prisma.garden.findUnique({
                    where: {
                        id: data.deviceId,
                        userId: authenticatedSocket.userId
                    }
                });
                if (!device) {
                    authenticatedSocket.emit('error', 'Device not found or access denied');
                    return;
                }
                const sensorData = await server_1.prisma.sensorData.create({
                    data: {
                        gardenId: data.deviceId,
                        temperature: data.temperature,
                        humidity: data.humidity,
                        soilMoisture: data.soilMoisture,
                        lightLevel: data.lightLevel
                    }
                });
                io.to(`device:${data.deviceId}`).emit('sensor-update', sensorData);
            }
            catch (error) {
                console.error('Error handling sensor data:', error);
                authenticatedSocket.emit('error', 'Failed to process sensor data');
            }
        });
        authenticatedSocket.on('device-control', async (data) => {
            try {
                const device = await server_1.prisma.garden.findUnique({
                    where: {
                        id: data.deviceId,
                        userId: authenticatedSocket.userId
                    }
                });
                if (!device) {
                    authenticatedSocket.emit('error', 'Device not found or access denied');
                    return;
                }
                const deviceStatus = await server_1.prisma.deviceStatus.create({
                    data: {
                        gardenId: data.deviceId,
                        fanStatus: data.fanStatus,
                        ledStatus: data.ledStatus,
                        nutrientPumpStatus: data.nutrientPumpStatus,
                        waterPumpStatus: data.waterPumpStatus
                    }
                });
                io.to(`device:${data.deviceId}`).emit('control-update', deviceStatus);
            }
            catch (error) {
                console.error('Error handling device control:', error);
                authenticatedSocket.emit('error', 'Failed to update device control');
            }
        });
        authenticatedSocket.on('disconnect', () => {
            console.log('Client disconnected:', authenticatedSocket.id);
            authenticatedSocket.deviceRooms.forEach(room => authenticatedSocket.leave(room));
            authenticatedSocket.deviceRooms.clear();
        });
    });
    return io;
};
exports.setupWebSocket = setupWebSocket;
//# sourceMappingURL=websocket.js.map