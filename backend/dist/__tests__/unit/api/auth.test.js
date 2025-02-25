"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../../../server");
const singleton_1 = require("../../../singleton");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
describe('Authentication API', () => {
    const mockContext = (0, singleton_1.createMockContext)();
    const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: bcryptjs_1.default.hashSync('password123', 10),
        fullName: 'Test User',
        preferredLanguage: 'en',
        themePreference: 'light',
        phoneNumber: null,
        dateOfBirth: null,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            mockContext.prisma.user.findUnique.mockResolvedValue(null);
            mockContext.prisma.user.create.mockResolvedValue(mockUser);
            const response = await (0, supertest_1.default)(server_1.app)
                .post('/api/auth/register')
                .send({
                email: 'test@example.com',
                password: 'password123',
                fullName: 'Test User',
                preferredLanguage: 'en',
                themePreference: 'light'
            });
            expect(response.status).toBe(201);
            expect(response.body.data).toHaveProperty('token');
        });
        it('should return 400 if email already exists', async () => {
            mockContext.prisma.user.findUnique.mockResolvedValue(mockUser);
            const response = await (0, supertest_1.default)(server_1.app)
                .post('/api/auth/register')
                .send({
                email: 'test@example.com',
                password: 'password123',
                fullName: 'Test User',
                preferredLanguage: 'en',
                themePreference: 'light'
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Email already exists');
        });
    });
    describe('POST /api/auth/login', () => {
        it('should login successfully with correct credentials', async () => {
            mockContext.prisma.user.findUnique.mockResolvedValue(mockUser);
            const response = await (0, supertest_1.default)(server_1.app)
                .post('/api/auth/login')
                .send({
                email: 'test@example.com',
                password: 'password123'
            });
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('token');
        });
        it('should return 401 with incorrect password', async () => {
            mockContext.prisma.user.findUnique.mockResolvedValue(mockUser);
            const response = await (0, supertest_1.default)(server_1.app)
                .post('/api/auth/login')
                .send({
                email: 'test@example.com',
                password: 'wrongpassword'
            });
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid email or password');
        });
    });
    describe('PATCH /api/auth/settings', () => {
        it('should update user settings successfully', async () => {
            const token = 'valid.test.token';
            mockContext.prisma.user.findUnique.mockResolvedValue(mockUser);
            mockContext.prisma.user.update.mockResolvedValue(Object.assign(Object.assign({}, mockUser), { preferredLanguage: 'vi', themePreference: 'dark' }));
            const response = await (0, supertest_1.default)(server_1.app)
                .patch('/api/auth/settings')
                .set('Authorization', `Bearer ${token}`)
                .send({
                preferredLanguage: 'vi',
                themePreference: 'dark'
            });
            expect(response.status).toBe(200);
            expect(response.body.data.user.preferredLanguage).toBe('vi');
            expect(response.body.data.user.themePreference).toBe('dark');
        });
        it('should return 401 without authentication', async () => {
            const response = await (0, supertest_1.default)(server_1.app)
                .patch('/api/auth/settings')
                .send({
                preferredLanguage: 'vi',
                themePreference: 'dark'
            });
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('You are not logged in. Please log in to get access.');
        });
    });
});
//# sourceMappingURL=auth.test.js.map