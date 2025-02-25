import request from 'supertest';
import { app } from '../../../server';
import { prismaMock } from '../../helpers/setupTests';
import { Request, Response, NextFunction } from 'express';
import { mockDevice } from '../../helpers/mockData';

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
      fullName: 'Test User'
    };
    next();
  }
}));

// Mock scheduler service
jest.mock('../../../services/scheduler.service', () => ({
  scheduleJob: jest.fn(),
  cancelJob: jest.fn()
}));

describe('Schedule API', () => {
  const mockSchedule = {
    id: 'test-schedule-id',
    gardenId: mockDevice.id,
    deviceType: 'fan',
    actionStatus: true,
    cronExpression: '0 * * * *',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/schedule/:deviceId', () => {
    it('should return schedules for a device', async () => {
      prismaMock.garden.findFirst.mockResolvedValue(mockDevice);
      prismaMock.schedule.findMany.mockResolvedValue([mockSchedule]);

      const response = await request(app)
        .get(`/api/schedule/${mockDevice.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.schedules).toHaveLength(1);
      expect(response.body.data.schedules[0]).toMatchObject({
        deviceType: 'fan',
        cronExpression: '0 * * * *'
      });
    });

    it('should return 404 for non-existent device', async () => {
      prismaMock.garden.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/schedule/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Device not found');
    });
  });

  describe('POST /api/schedule/:deviceId', () => {
    const newSchedule = {
      deviceType: 'fan',
      actionStatus: true,
      cronExpression: '0 * * * *'
    };

    it('should create a new schedule', async () => {
      prismaMock.garden.findFirst.mockResolvedValue(mockDevice);
      prismaMock.schedule.create.mockResolvedValue({
        ...mockSchedule,
        ...newSchedule
      });

      const response = await request(app)
        .post(`/api/schedule/${mockDevice.id}`)
        .send(newSchedule);

      expect(response.status).toBe(201);
      expect(response.body.data.schedule).toMatchObject(newSchedule);
    });

    it('should return 404 for non-existent device', async () => {
      prismaMock.garden.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/schedule/non-existent-id')
        .send(newSchedule);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Device not found');
    });

    it('should return 400 for invalid cron expression', async () => {
      prismaMock.garden.findFirst.mockResolvedValue(mockDevice);

      const response = await request(app)
        .post(`/api/schedule/${mockDevice.id}`)
        .send({
          ...newSchedule,
          cronExpression: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid cron expression');
    });

    it('should return 400 for missing required fields', async () => {
      prismaMock.garden.findFirst.mockResolvedValue(mockDevice);

      const response = await request(app)
        .post(`/api/schedule/${mockDevice.id}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Missing required fields');
    });
  });

  describe('PATCH /api/schedule/:deviceId/schedules/:scheduleId', () => {
    it('should update a schedule', async () => {
      prismaMock.garden.findFirst.mockResolvedValue(mockDevice);
      prismaMock.schedule.findFirst.mockResolvedValue(mockSchedule);
      prismaMock.schedule.update.mockResolvedValue({
        ...mockSchedule,
        isActive: false
      });

      const response = await request(app)
        .patch(`/api/schedule/${mockDevice.id}/schedules/${mockSchedule.id}`)
        .send({ isActive: false });

      expect(response.status).toBe(200);
      expect(response.body.data.schedule.isActive).toBe(false);
    });

    it('should return 404 for non-existent device', async () => {
      prismaMock.garden.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .patch(`/api/schedule/non-existent-id/schedules/${mockSchedule.id}`)
        .send({ isActive: false });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Device not found');
    });

    it('should return 404 for non-existent schedule', async () => {
      prismaMock.garden.findFirst.mockResolvedValue(mockDevice);
      prismaMock.schedule.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .patch(`/api/schedule/${mockDevice.id}/schedules/non-existent-id`)
        .send({ isActive: false });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Schedule not found');
    });
  });

  describe('DELETE /api/schedule/:deviceId/schedules/:scheduleId', () => {
    it('should delete a schedule', async () => {
      prismaMock.garden.findFirst.mockResolvedValue(mockDevice);
      prismaMock.schedule.findFirst.mockResolvedValue(mockSchedule);
      prismaMock.schedule.delete.mockResolvedValue(mockSchedule);

      const response = await request(app)
        .delete(`/api/schedule/${mockDevice.id}/schedules/${mockSchedule.id}`);

      expect(response.status).toBe(204);
    });

    it('should return 404 for non-existent device', async () => {
      prismaMock.garden.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .delete(`/api/schedule/non-existent-id/schedules/${mockSchedule.id}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Device not found');
    });

    it('should return 404 for non-existent schedule', async () => {
      prismaMock.garden.findFirst.mockResolvedValue(mockDevice);
      prismaMock.schedule.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .delete(`/api/schedule/${mockDevice.id}/schedules/non-existent-id`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Schedule not found');
    });
  });
}); 