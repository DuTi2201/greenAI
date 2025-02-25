import request from 'supertest';
import { app } from '../../../server';
import { prismaMock } from '../../helpers/setupTests';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { sendResetPasswordEmail } from '../../../services/email.service';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        fullName: string | null;
      }
    }
  }
}

// Mock middleware auth
jest.mock('../../../middleware/auth', () => ({
  protect: (req: Request, _res: Response, next: NextFunction) => {
    if (!req.headers.authorization?.startsWith('Bearer ')) {
      return _res.status(401).json({
        status: 'fail',
        message: 'You are not logged in. Please log in to get access.'
      });
    }
    const token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret') as { id: string };
      req.user = { 
        id: decoded.id,
        email: 'test@example.com',
        fullName: null
      };
      return next();
    } catch (err) {
      return _res.status(401).json({
        status: 'fail',
        message: 'Invalid token'
      });
    }
  }
}));

// Mock email service
jest.mock('../../../services/email.service');

describe('Authentication API', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    passwordHash: bcrypt.hashSync('password123', 10),
    fullName: 'Test User',
    preferredLanguage: 'vi',
    themePreference: 'light',
    phoneNumber: null,
    dateOfBirth: null,
    resetToken: null,
    resetTokenExpiry: null,
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (sendResetPasswordEmail as jest.Mock).mockResolvedValue(undefined);
  });

  describe('POST /api/auth/register', () => {
    const newUser = {
      email: 'new@example.com',
      password: 'password123',
      fullName: 'New User'
    };

    it('should register a new user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        ...mockUser,
        email: newUser.email,
        fullName: newUser.fullName
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(newUser.email);
    });

    it('should return 400 if email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email already exists');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Missing required fields');
    });
  });

  describe('POST /api/auth/login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    beforeEach(() => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
    });

    it('should login successfully', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.data.user).toMatchObject({
        email: mockUser.email,
        fullName: mockUser.fullName
      });
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: loginData.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Missing email or password');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send reset password email', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...mockUser,
        resetToken: 'reset-token',
        resetTokenExpiry: new Date(Date.now() + 3600000)
      });
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        resetToken: 'reset-token',
        resetTokenExpiry: new Date(Date.now() + 3600000)
      });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: mockUser.email });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Reset password email sent');
      expect(sendResetPasswordEmail).toHaveBeenCalledWith(mockUser.email, 'reset-token');
    });

    it('should return 404 for non-existent email', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email is required');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    const resetData = {
      token: 'valid-reset-token',
      newPassword: 'newpassword123'
    };

    it('should reset password successfully', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...mockUser,
        resetToken: resetData.token,
        resetTokenExpiry: new Date(Date.now() + 3600000)
      });
      prismaMock.user.update.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password reset successful');
    });

    it('should return 400 for invalid token', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid or expired reset token');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Token and new password are required');
    });
  });

  describe('GET /api/auth/me', () => {
    const token = jwt.sign(
      { id: mockUser.id },
      process.env.JWT_SECRET || 'test-secret'
    );

    it('should return current user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user).toMatchObject({
        email: mockUser.email,
        fullName: mockUser.fullName
      });
    });

    it('should return 404 for non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('You are not logged in. Please log in to get access.');
    });
  });

  describe('PATCH /api/auth/settings', () => {
    const token = jwt.sign(
      { id: mockUser.id },
      process.env.JWT_SECRET || 'test-secret'
    );

    it('should update user settings successfully', async () => {
      const updateData = {
        preferredLanguage: 'en',
        themePreference: 'dark'
      };

      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        ...updateData
      });

      const response = await request(app)
        .patch('/api/auth/settings')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.user.preferredLanguage).toBe('en');
      expect(response.body.data.user.themePreference).toBe('dark');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .patch('/api/auth/settings')
        .send({ preferredLanguage: 'en' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('You are not logged in. Please log in to get access.');
    });
  });
}); 