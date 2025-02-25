"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../../../server");
const singleton_1 = require("../../../singleton");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
describe('Device API', () => {
    let userId;
    let authToken;
    let testUser;
    beforeAll(async () => {
        try {
            await singleton_1.prisma.user.deleteMany({
                where: { email: 'test@example.com' }
            });
            const passwordHash = await bcryptjs_1.default.hash('password123', 10);
            testUser = await singleton_1.prisma.user.create({
                data: {
                    email: 'test@example.com',
                    passwordHash: passwordHash,
                    fullName: 'Test User',
                    preferredLanguage: 'en',
                    themePreference: 'light'
                }
            });
            if (!testUser) {
                throw new Error('Failed to create test user');
            }
            userId = testUser.id;
            authToken = jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret');
        }
        catch (error) {
            console.error('Setup failed:', error);
            throw error;
        }
    });
    afterAll(async () => {
        await singleton_1.prisma.garden.deleteMany({
            where: { userId: userId }
        });
        await singleton_1.prisma.user.delete({
            where: { id: userId }
        });
        await singleton_1.prisma.$disconnect();
    });
    describe('GET /api/devices', () => {
        beforeEach(async () => {
            await singleton_1.prisma.garden.create({
                data: {
                    userId,
                    wemosSerial: 'TEST001',
                    name: 'Test Device',
                    apiKey: 'testkey',
                    status: 'active'
                }
            });
        });
        it('should return 401 if not authenticated', async () => {
            const response = await (0, supertest_1.default)(server_1.app).get('/api/devices');
            expect(response.status).toBe(401);
        });
        it('should return devices for authenticated user', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/devices')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.data.devices).toHaveLength(1);
            expect(response.body.data.devices[0].name).toBe('Test Device');
        });
    });
    describe('POST /api/devices', () => {
        it('should create new device', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .post('/api/devices')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                wemosSerial: 'TEST002',
                name: 'New Device',
                location: 'Test Location'
            });
            expect(response.status).toBe(201);
            expect(response.body.data.device.name).toBe('New Device');
            expect(response.body.data.device.status).toBe('active');
        });
        it('should return 400 for duplicate serial', async () => {
            await (0, supertest_1.default)(server_1.app)
                .post('/api/devices')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                wemosSerial: 'TEST003',
                name: 'Device 1'
            });
            const response = await (0, supertest_1.default)(server_1.app)
                .post('/api/devices')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                wemosSerial: 'TEST003',
                name: 'Device 2'
            });
            expect(response.status).toBe(400);
        });
    });
    describe('PATCH /api/devices/:id', () => {
        let deviceId;
        beforeEach(async () => {
            const device = await singleton_1.prisma.garden.create({
                data: {
                    userId,
                    wemosSerial: 'TEST004',
                    name: 'Test Device',
                    apiKey: 'testkey',
                    status: 'active'
                }
            });
            deviceId = device.id;
        });
        it('should update device', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .patch(`/api/devices/${deviceId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                name: 'Updated Device',
                location: 'New Location'
            });
            expect(response.status).toBe(200);
            expect(response.body.data.device.name).toBe('Updated Device');
            expect(response.body.data.device.location).toBe('New Location');
        });
        it('should return 404 for non-existent device', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .patch('/api/devices/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                name: 'Updated Device'
            });
            expect(response.status).toBe(404);
        });
    });
});
//# sourceMappingURL=devices.e2e.test.js.map