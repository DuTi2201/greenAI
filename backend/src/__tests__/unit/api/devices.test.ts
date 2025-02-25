import request from 'supertest';
import { app } from '../../../app';
import { prismaMock } from '../../helpers/prisma-mock';
import { mockDevice } from '../../helpers/mockData';
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
      id: mockDevice.userId,
      email: 'test@example.com',
      fullName: 'Test User'
    };
    next();
  }
}));

describe('Devices API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.garden.findMany.mockResolvedValue([mockDevice]);
    prismaMock.garden.findUnique.mockResolvedValue(mockDevice);
    prismaMock.garden.create.mockResolvedValue(mockDevice);
    prismaMock.garden.update.mockResolvedValue(mockDevice);
    prismaMock.garden.delete.mockResolvedValue(mockDevice);
  });

  describe('GET /api/devices', () => {
    it('should return all devices for user', async () => {
      const response = await request(app).get('/api/devices');

      expect(response.status).toBe(200);
      expect(response.body.data.devices).toHaveLength(1);
      expect(response.body.data.devices[0]).toMatchObject({
        name: mockDevice.name,
        wemosSerial: mockDevice.wemosSerial
      });
    });
  });

  describe('GET /api/devices/:id', () => {
    it('should return a single device', async () => {
      const response = await request(app).get(`/api/devices/${mockDevice.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.device).toMatchObject({
        name: mockDevice.name,
        wemosSerial: mockDevice.wemosSerial
      });
    });

    it('should return 404 for non-existent device', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/api/devices/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Device not found');
    });
  });

  describe('POST /api/devices', () => {
    const newDevice = {
      name: 'New Garden',
      wemosSerial: 'NEW001',
      location: 'Outdoor'
    };

    it('should create a new device', async () => {
      prismaMock.garden.create.mockResolvedValue({
        ...mockDevice,
        ...newDevice
      });

      const response = await request(app)
        .post('/api/devices')
        .send(newDevice);

      expect(response.status).toBe(201);
      expect(response.body.data.device).toMatchObject(newDevice);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/devices')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Missing required fields');
    });
  });

  describe('PATCH /api/devices/:id', () => {
    it('should update a device', async () => {
      const updateData = {
        name: 'Updated Garden',
        location: 'Indoor'
      };

      prismaMock.garden.update.mockResolvedValue({
        ...mockDevice,
        ...updateData
      });

      const response = await request(app)
        .patch(`/api/devices/${mockDevice.id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.device).toMatchObject(updateData);
    });

    it('should return 404 for non-existent device', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/devices/non-existent-id')
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Device not found');
    });
  });

  describe('DELETE /api/devices/:id', () => {
    it('should delete a device', async () => {
      const response = await request(app)
        .delete(`/api/devices/${mockDevice.id}`);

      expect(response.status).toBe(204);
    });

    it('should return 404 for non-existent device', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/devices/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Device not found');
    });
  });

  describe('POST /api/devices/:id/control', () => {
    const controlData = {
      fanStatus: true,
      ledStatus: false
    };

    it('should update device status', async () => {
      const response = await request(app)
        .post(`/api/devices/${mockDevice.id}/control`)
        .send(controlData);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toMatchObject(controlData);
    });

    it('should return 404 for non-existent device', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/devices/non-existent-id/control')
        .send(controlData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Device not found');
    });
  });
}); 