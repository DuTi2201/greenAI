import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../prisma';
import bcrypt from 'bcrypt';

describe('Authentication API', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe('POST /api/auth/register', () => {
    const validUser = {
      email: 'test@example.com',
      password: 'Test@123',
      fullName: 'Test User',
    };

    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(validUser.email);
    });

    it('should not allow duplicate email registration', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(validUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/email already exists/i);
    });

    it('should validate password requirements', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          password: '123', // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/password/i);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: hashedPassword,
          fullName: 'Test User',
        },
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
    });

    it('should not login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrong-password',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/invalid credentials/i);
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test@123',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/invalid credentials/i);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: await bcrypt.hash('Test@123', 10),
          fullName: 'Test User',
        },
      });
    });

    it('should generate reset token for valid email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(200);
      
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });
      expect(user?.resetToken).toBeDefined();
      expect(user?.resetTokenExpiry).toBeInstanceOf(Date);
    });

    it('should handle non-existent email gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        });

      expect(response.status).toBe(200); // For security, don't reveal if email exists
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
  });
}); 