import request from 'supertest';
import { app } from '../../../server';
import { prismaMock } from '../../helpers/setupTests';
import { Request, Response, NextFunction } from 'express';

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
    req.user = { 
      id: 'test-user-id',
      email: 'test@example.com',
      fullName: null
    };
    next();
  }
}));

describe('Settings API', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    passwordHash: '$2a$10$test',
    fullName: 'Test User',
    preferredLanguage: 'en',
    themePreference: 'light',
    phoneNumber: null,
    dateOfBirth: null,
    resetToken: null,
    resetTokenExpiry: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockNotification = {
    id: 'test-notification-id',
    userId: 'test-user-id',
    gardenId: 'test-device-id',
    title: 'Test Notification',
    message: 'This is a test notification',
    type: 'info',
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body.data.user).toMatchObject({
        email: mockUser.email,
        fullName: mockUser.fullName,
        preferredLanguage: mockUser.preferredLanguage,
        themePreference: mockUser.themePreference
      });
    });

    it('should return 404 for non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('PATCH /api/auth/settings', () => {
    it('should update user preferences', async () => {
      const updateData = {
        preferredLanguage: 'vi',
        themePreference: 'dark'
      };

      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        ...updateData
      });

      const response = await request(app)
        .patch('/api/auth/settings')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.user).toMatchObject(updateData);
    });

    it('should return 400 for invalid language preference', async () => {
      const response = await request(app)
        .patch('/api/auth/settings')
        .send({
          preferredLanguage: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid language preference');
    });

    it('should return 400 for invalid theme preference', async () => {
      const response = await request(app)
        .patch('/api/auth/settings')
        .send({
          themePreference: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid theme preference');
    });
  });

  describe('GET /api/notifications', () => {
    it('should return user notifications', async () => {
      prismaMock.notification.findMany.mockResolvedValue([mockNotification]);

      const response = await request(app)
        .get('/api/notifications');

      expect(response.status).toBe(200);
      expect(response.body.data.notifications).toHaveLength(1);
      expect(response.body.data.notifications[0]).toMatchObject({
        title: mockNotification.title,
        message: mockNotification.message,
        isRead: false
      });
    });
  });

  describe('PATCH /api/notifications/:id', () => {
    it('should mark notification as read', async () => {
      prismaMock.notification.findFirst.mockResolvedValue(mockNotification);
      prismaMock.notification.update.mockResolvedValue({
        ...mockNotification,
        isRead: true
      });

      const response = await request(app)
        .patch(`/api/notifications/${mockNotification.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.notification.isRead).toBe(true);
    });

    it('should return 404 for non-existent notification', async () => {
      prismaMock.notification.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/notifications/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Notification not found');
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should delete notification', async () => {
      prismaMock.notification.findFirst.mockResolvedValue(mockNotification);
      prismaMock.notification.delete.mockResolvedValue(mockNotification);

      const response = await request(app)
        .delete(`/api/notifications/${mockNotification.id}`);

      expect(response.status).toBe(204);
    });

    it('should return 404 for non-existent notification', async () => {
      prismaMock.notification.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/notifications/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Notification not found');
    });
  });
}); 