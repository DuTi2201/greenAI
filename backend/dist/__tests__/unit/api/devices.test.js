"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../../../server");
const singleton_1 = require("../../../singleton");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mockUser = {
    id: '123',
    email: 'test@example.com',
    fullName: 'Test User',
    passwordHash: 'hashedpassword',
    preferredLanguage: 'en',
    themePreference: 'light',
    createdAt: new Date(),
    updatedAt: new Date(),
    phoneNumber: null,
    dateOfBirth: null
};
const mockDevices = [
    {
        id: '456',
        userId: mockUser.id,
        name: 'Test Garden',
        wemosSerial: 'WEMOS123',
        apiKey: 'test-api-key',
        location: null,
        status: 'online',
        lastConnected: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deviceStatus: [
            {
                fanStatus: true,
                ledStatus: true,
                waterPumpStatus: false,
                nutrientPumpStatus: false
            }
        ]
    }
];
const mockDevice = {
    id: '456',
    userId: mockUser.id,
    name: 'Test Garden',
    wemosSerial: 'WEMOS123',
    apiKey: 'test-api-key',
    location: null,
    status: 'online',
    lastConnected: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
};
describe('Devices API', () => {
    describe('GET /api/devices', () => {
        it('should return all devices for authenticated user', async () => {
            const token = jsonwebtoken_1.default.sign({ id: mockUser.id }, process.env.JWT_SECRET || 'test-secret');
            singleton_1.prismaMock.garden.findMany.mockResolvedValue(mockDevices);
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/devices')
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body.data.devices).toHaveLength(1);
            expect(response.body.data.devices[0].id).toBe(mockDevices[0].id);
        });
        it('should return 401 without authentication', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/devices');
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Please authenticate');
        });
    });
    describe('POST /api/devices', () => {
        it('should create a new device', async () => {
            const token = jsonwebtoken_1.default.sign({ id: mockUser.id }, process.env.JWT_SECRET || 'test-secret');
            singleton_1.prismaMock.garden.create.mockResolvedValue(mockDevice);
            const response = await (0, supertest_1.default)(server_1.app)
                .post('/api/devices')
                .set('Authorization', `Bearer ${token}`)
                .send({
                name: 'Test Garden',
                wemosSerial: 'WEMOS123'
            });
            expect(response.status).toBe(201);
            expect(response.body.data.device.name).toBe(mockDevice.name);
            expect(response.body.data.device.wemosSerial).toBe(mockDevice.wemosSerial);
        });
        it('should return 400 if device with serial exists', async () => {
            const token = jsonwebtoken_1.default.sign({ id: mockUser.id }, process.env.JWT_SECRET || 'test-secret');
            const existingDevice = Object.assign({}, mockDevice);
            singleton_1.prismaMock.garden.findUnique.mockResolvedValue(existingDevice);
            const response = await (0, supertest_1.default)(server_1.app)
                .post('/api/devices')
                .set('Authorization', `Bearer ${token}`)
                .send({
                name: 'Test Garden',
                wemosSerial: 'WEMOS123'
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Device with this serial already exists');
        });
    });
    describe('PATCH /api/devices/:id', () => {
        it('should update device details', async () => {
            const token = jsonwebtoken_1.default.sign({ id: mockUser.id }, process.env.JWT_SECRET || 'test-secret');
            singleton_1.prismaMock.garden.findUnique.mockResolvedValue(mockDevice);
            singleton_1.prismaMock.garden.update.mockResolvedValue(Object.assign(Object.assign({}, mockDevice), { name: 'Updated Garden', location: 'New Location' }));
            const response = await (0, supertest_1.default)(server_1.app)
                .patch(`/api/devices/${mockDevice.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                name: 'Updated Garden',
                location: 'New Location'
            });
            expect(response.status).toBe(200);
            expect(response.body.data.device.name).toBe('Updated Garden');
            expect(response.body.data.device.location).toBe('New Location');
        });
        it('should return 404 for non-existent device', async () => {
            const token = jsonwebtoken_1.default.sign({ id: mockUser.id }, process.env.JWT_SECRET || 'test-secret');
            singleton_1.prismaMock.garden.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(server_1.app)
                .patch('/api/devices/nonexistent')
                .set('Authorization', `Bearer ${token}`)
                .send({
                name: 'Updated Garden'
            });
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Device not found');
        });
    });
    describe('DELETE /api/devices/:id', () => {
        it('should delete a device', async () => {
            const token = jsonwebtoken_1.default.sign({ id: mockUser.id }, process.env.JWT_SECRET || 'test-secret');
            singleton_1.prismaMock.garden.findUnique.mockResolvedValue(mockDevice);
            singleton_1.prismaMock.garden.delete.mockResolvedValue(mockDevice);
            const response = await (0, supertest_1.default)(server_1.app)
                .delete(`/api/devices/${mockDevice.id}`)
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(204);
        });
        it('should return 404 for non-existent device', async () => {
            const token = jsonwebtoken_1.default.sign({ id: mockUser.id }, process.env.JWT_SECRET || 'test-secret');
            singleton_1.prismaMock.garden.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(server_1.app)
                .delete('/api/devices/nonexistent')
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Device not found');
        });
    });
    describe('POST /api/devices/:id/control', () => {
        it('should update device controls', async () => {
            const token = jsonwebtoken_1.default.sign({ id: mockUser.id }, process.env.JWT_SECRET || 'test-secret');
            singleton_1.prismaMock.garden.findUnique.mockResolvedValue(mockDevice);
            singleton_1.prismaMock.deviceStatus.create.mockResolvedValue({
                id: '789',
                gardenId: mockDevice.id,
                fanStatus: true,
                ledStatus: true,
                waterPumpStatus: false,
                nutrientPumpStatus: false,
                updatedAt: new Date()
            });
            const response = await (0, supertest_1.default)(server_1.app)
                .post(`/api/devices/${mockDevice.id}/control`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                fanStatus: true,
                ledStatus: true,
                waterPumpStatus: false,
                nutrientPumpStatus: false
            });
            expect(response.status).toBe(200);
            expect(response.body.data.status.fanStatus).toBe(true);
            expect(response.body.data.status.ledStatus).toBe(true);
            expect(response.body.data.status.waterPumpStatus).toBe(false);
            expect(response.body.data.status.nutrientPumpStatus).toBe(false);
        });
        it('should return 404 for non-existent device', async () => {
            const token = jsonwebtoken_1.default.sign({ id: mockUser.id }, process.env.JWT_SECRET || 'test-secret');
            singleton_1.prismaMock.garden.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(server_1.app)
                .post('/api/devices/nonexistent/control')
                .set('Authorization', `Bearer ${token}`)
                .send({
                fanStatus: true
            });
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Device not found');
        });
    });
});
//# sourceMappingURL=devices.test.js.map