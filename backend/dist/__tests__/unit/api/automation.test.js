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
const mockRules = [
    {
        id: '789',
        gardenId: mockDevice.id,
        sensorType: 'temperature',
        conditionOperator: '>',
        thresholdValue: 30,
        actionDevice: 'fan',
        actionStatus: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];
const mockRule = {
    id: '789',
    gardenId: mockDevice.id,
    sensorType: 'temperature',
    conditionOperator: '>',
    thresholdValue: 30,
    actionDevice: 'fan',
    actionStatus: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
};
describe('Automation API', () => {
    describe('GET /api/automation/:deviceId', () => {
        it('should return all automation rules for a device', async () => {
            const token = jsonwebtoken_1.default.sign({ id: mockUser.id }, process.env.JWT_SECRET || 'test-secret');
            singleton_1.prismaMock.garden.findUnique.mockResolvedValue(mockDevice);
            singleton_1.prismaMock.automationRule.findMany.mockResolvedValue(mockRules);
            const response = await (0, supertest_1.default)(server_1.app)
                .get(`/api/automation/${mockDevice.id}`)
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(200);
            expect(response.body.data.rules).toHaveLength(1);
            expect(response.body.data.rules[0].id).toBe(mockRules[0].id);
        });
        it('should return 404 for non-existent device', async () => {
            const token = jsonwebtoken_1.default.sign({ id: mockUser.id }, process.env.JWT_SECRET || 'test-secret');
            singleton_1.prismaMock.garden.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(server_1.app)
                .get('/api/automation/nonexistent')
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Device not found');
        });
    });
    describe('POST /api/automation/:deviceId', () => {
        it('should create a new automation rule', async () => {
            const token = jsonwebtoken_1.default.sign({ id: mockUser.id }, process.env.JWT_SECRET || 'test-secret');
            singleton_1.prismaMock.garden.findUnique.mockResolvedValue(mockDevice);
            singleton_1.prismaMock.automationRule.create.mockResolvedValue(mockRule);
            const response = await (0, supertest_1.default)(server_1.app)
                .post(`/api/automation/${mockDevice.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                sensorType: 'temperature',
                conditionOperator: '>',
                thresholdValue: 30,
                actionDevice: 'fan',
                actionStatus: true
            });
            expect(response.status).toBe(201);
            expect(response.body.data.rule.sensorType).toBe(mockRule.sensorType);
            expect(response.body.data.rule.actionDevice).toBe(mockRule.actionDevice);
        });
        it('should return 400 if required fields are missing', async () => {
            const token = jsonwebtoken_1.default.sign({ id: mockUser.id }, process.env.JWT_SECRET || 'test-secret');
            const response = await (0, supertest_1.default)(server_1.app)
                .post(`/api/automation/${mockDevice.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                sensorType: 'temperature'
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Missing required fields');
        });
    });
    describe('PATCH /api/automation/:deviceId/rules/:ruleId', () => {
        it('should update an automation rule', async () => {
            const token = jsonwebtoken_1.default.sign({ id: mockUser.id }, process.env.JWT_SECRET || 'test-secret');
            singleton_1.prismaMock.garden.findUnique.mockResolvedValue(mockDevice);
            singleton_1.prismaMock.automationRule.update.mockResolvedValue(Object.assign(Object.assign({}, mockRule), { thresholdValue: 25, isActive: false }));
            const response = await (0, supertest_1.default)(server_1.app)
                .patch(`/api/automation/${mockDevice.id}/rules/${mockRule.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                thresholdValue: 25,
                isActive: false
            });
            expect(response.status).toBe(200);
            expect(response.body.data.rule.thresholdValue).toBe(25);
            expect(response.body.data.rule.isActive).toBe(false);
        });
        it('should return 404 for non-existent rule', async () => {
            const token = jsonwebtoken_1.default.sign({ id: mockUser.id }, process.env.JWT_SECRET || 'test-secret');
            singleton_1.prismaMock.garden.findUnique.mockResolvedValue(mockDevice);
            singleton_1.prismaMock.automationRule.update.mockRejectedValue(new Error('Rule not found'));
            const response = await (0, supertest_1.default)(server_1.app)
                .patch(`/api/automation/${mockDevice.id}/rules/nonexistent`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                thresholdValue: 25
            });
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Automation rule not found');
        });
    });
    describe('DELETE /api/automation/:deviceId/rules/:ruleId', () => {
        it('should delete an automation rule', async () => {
            const token = jsonwebtoken_1.default.sign({ id: mockUser.id }, process.env.JWT_SECRET || 'test-secret');
            singleton_1.prismaMock.garden.findUnique.mockResolvedValue(mockDevice);
            singleton_1.prismaMock.automationRule.delete.mockResolvedValue({
                id: mockRule.id,
                gardenId: mockDevice.id,
                sensorType: 'temperature',
                conditionOperator: '>',
                thresholdValue: 30,
                actionDevice: 'fan',
                actionStatus: true,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            const response = await (0, supertest_1.default)(server_1.app)
                .delete(`/api/automation/${mockDevice.id}/rules/${mockRule.id}`)
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(204);
        });
        it('should return 404 for non-existent rule', async () => {
            const token = jsonwebtoken_1.default.sign({ id: mockUser.id }, process.env.JWT_SECRET || 'test-secret');
            singleton_1.prismaMock.garden.findUnique.mockResolvedValue(mockDevice);
            singleton_1.prismaMock.automationRule.delete.mockRejectedValue(new Error('Rule not found'));
            const response = await (0, supertest_1.default)(server_1.app)
                .delete(`/api/automation/${mockDevice.id}/rules/nonexistent`)
                .set('Authorization', `Bearer ${token}`);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Automation rule not found');
        });
    });
});
//# sourceMappingURL=automation.test.js.map