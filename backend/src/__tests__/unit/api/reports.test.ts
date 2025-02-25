import request from 'supertest';
import { app } from '../../../server';
import { prismaMock } from '../../helpers/setupTests';
import { Request, Response, NextFunction } from 'express';
import { mockDevice, mockSensorData, mockDeviceStatus } from '../../helpers/mockData';
import { analyzeGardenData } from '../../../services/ai.service';

// Mock AI service
jest.mock('../../../services/ai.service', () => ({
  analyzeGardenData: jest.fn()
}));

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

describe('Reports API', () => {
  const mockAnalysis = {
    id: 'test-analysis-id',
    gardenId: 'test-device-id',
    reportType: 'temperature',
    result: {
      temperatureAnalysis: {
        trends: ['trend1', 'trend2'],
        impact: 'high',
        recommendations: ['rec1', 'rec2']
      }
    },
    analysisPeriodStart: new Date(),
    analysisPeriodEnd: new Date(),
    geminiModelVersion: '1.0.0',
    status: 'completed',
    reportFormat: 'json',
    createdAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/reports/:deviceId/history', () => {
    it('should return device history', async () => {
      prismaMock.garden.findFirst.mockResolvedValue(mockDevice);
      prismaMock.sensorData.findMany.mockResolvedValue([mockSensorData]);
      prismaMock.deviceStatus.findMany.mockResolvedValue([mockDeviceStatus]);

      const response = await request(app)
        .get(`/api/reports/${mockDevice.id}/history`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.sensorData).toHaveLength(1);
      expect(response.body.data.deviceStatus).toHaveLength(1);
    });

    it('should return 404 for non-existent device', async () => {
      prismaMock.garden.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/reports/non-existent-id/history');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Device not found');
    });

    it('should return 400 for invalid date format', async () => {
      prismaMock.garden.findFirst.mockResolvedValue(mockDevice);

      const response = await request(app)
        .get(`/api/reports/${mockDevice.id}/history`)
        .query({
          startDate: 'invalid-date'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid date format');
    });
  });

  describe('POST /api/reports/:deviceId/analyze', () => {
    const analysisRequest = {
      analysisType: 'growth',
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    };

    it('should analyze device data', async () => {
      prismaMock.garden.findFirst.mockResolvedValue(mockDevice);
      prismaMock.sensorData.findMany.mockResolvedValue([mockSensorData]);
      prismaMock.deviceStatus.findMany.mockResolvedValue([mockDeviceStatus]);
      prismaMock.aIReport.create.mockResolvedValue(mockAnalysis);
      (analyzeGardenData as jest.Mock).mockResolvedValue(mockAnalysis.result);

      const response = await request(app)
        .post(`/api/reports/${mockDevice.id}/analyze`)
        .send(analysisRequest);

      expect(response.status).toBe(200);
      expect(response.body.data.analysis).toMatchObject({
        analysisType: 'growth',
        result: expect.any(Object)
      });
    });

    it('should return 404 for non-existent device', async () => {
      prismaMock.garden.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/reports/non-existent-id/analyze')
        .send(analysisRequest);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Device not found');
    });

    it('should return 400 for missing analysis type', async () => {
      prismaMock.garden.findFirst.mockResolvedValue(mockDevice);

      const response = await request(app)
        .post(`/api/reports/${mockDevice.id}/analyze`)
        .send({
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Analysis type is required');
    });

    it('should return 400 for invalid date format', async () => {
      prismaMock.garden.findFirst.mockResolvedValue(mockDevice);

      const response = await request(app)
        .post(`/api/reports/${mockDevice.id}/analyze`)
        .send({
          ...analysisRequest,
          startDate: 'invalid-date'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid date format');
    });
  });

  describe('GET /api/reports/:deviceId/analysis', () => {
    it('should return analysis list', async () => {
      prismaMock.garden.findFirst.mockResolvedValue(mockDevice);
      prismaMock.aIReport.findMany.mockResolvedValue([mockAnalysis]);

      const response = await request(app)
        .get(`/api/reports/${mockDevice.id}/analysis`);

      expect(response.status).toBe(200);
      expect(response.body.data.analyses).toHaveLength(1);
      expect(response.body.data.analyses[0]).toMatchObject({
        analysisType: 'growth',
        result: expect.any(Object)
      });
    });

    it('should return 404 for non-existent device', async () => {
      prismaMock.garden.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/reports/non-existent-id/analysis');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Device not found');
    });
  });
}); 