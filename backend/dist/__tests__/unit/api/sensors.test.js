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
describe('Sensors API', () => {
    describe('GET /api/devices/:id/sensors', () => {
        it('should return sensor data for a device', async () => {
            const token = jsonwebtoken_1.default.sign({ id: mockUser.id }, process.env.JWT_SECRET || 'test-secret');
            singleton_1.prismaMock.garden.findUnique.mockResolvedValue(mockDevice);
            singleton_1.prismaMock.sensorData.findMany.mockResolvedValue([
                {
                    id: '789',
                    gardenId: mockDevice.id,
                    temperature: 25,
                    humidity: 60,
                    soilMoisture: 70,
                    lightLevel: 800,
                    recordedAt: new Date()
                }
            ]);
            const response = await (0, supertest_1.default)(server_1.app)
                .get(`/api/devices/${mockDevice.id}/sensors`)
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body.data.sensorData).toHaveLength(1);
            expect(response.body.data.sensorData[0].temperature).toBe(25);
        });
        it('should return 404 for non-existent device', async () => {
            const token = jsonwebtoken_1.default.sign({ id: mockUser.id }, process.env.JWT_SECRET || 'test-secret');
            singleton_1.prismaMock.garden.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/devices/nonexistent/sensors')
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Device not found');
        });
    });
});
//# sourceMappingURL=sensors.test.js.map