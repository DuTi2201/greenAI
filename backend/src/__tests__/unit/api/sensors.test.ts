import request from 'supertest';
import { app } from '../../../server';
import { prismaMock } from '../../helpers/setupTests';
import { Request, Response, NextFunction } from 'express';
import { mockDevice, mockSensorData, createMockPrismaGarden } from '../../helpers/mockData';

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

describe('Sensors API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/sensors/:deviceId', () => {
    it('should return sensor data for a device', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(createMockPrismaGarden());

      const response = await request(app)
        .get(`/api/sensors/${mockDevice.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.sensorData).toHaveLength(1);
      expect(response.body.data.sensorData[0]).toMatchObject({
        temperature: mockSensorData.temperature,
        humidity: mockSensorData.humidity,
        lightLevel: mockSensorData.lightLevel,
        soilMoisture: mockSensorData.soilMoisture
      });
    });

    it('should return 404 for non-existent device', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/sensors/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Device not found');
    });
  });

  describe('POST /api/sensors/:deviceId', () => {
    const newSensorData = {
      temperature: 25,
      humidity: 60,
      lightLevel: 800,
      soilMoisture: 70
    };

    it('should create new sensor data', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(createMockPrismaGarden());

      const response = await request(app)
        .post(`/api/sensors/${mockDevice.id}`)
        .send(newSensorData);

      expect(response.status).toBe(201);
      expect(response.body.data.sensorData).toMatchObject(newSensorData);
    });

    it('should return 404 for non-existent device', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/sensors/non-existent-id')
        .send(newSensorData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Device not found');
    });

    it('should return 400 for missing required fields', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(createMockPrismaGarden());

      const response = await request(app)
        .post(`/api/sensors/${mockDevice.id}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Missing required fields');
    });
  });
}); 