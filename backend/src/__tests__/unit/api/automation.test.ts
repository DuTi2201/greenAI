import request from 'supertest';
import { app } from '../../../server';
import { prismaMock } from '../../helpers/setupTests';
import { Request, Response, NextFunction } from 'express';
import { mockDevice, mockRule, createMockPrismaGarden } from '../../helpers/mockData';

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

describe('Automation API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/automation/:deviceId', () => {
    it('should return automation rules for a device', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(createMockPrismaGarden());

      const response = await request(app)
        .get(`/api/automation/${mockDevice.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.rules).toHaveLength(1);
      expect(response.body.data.rules[0]).toMatchObject({
        sensorType: 'temperature',
        conditionOperator: '>',
        thresholdValue: 30
      });
    });

    it('should return 404 for non-existent device', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/automation/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Device not found');
    });
  });

  describe('POST /api/automation/:deviceId', () => {
    const newRule = {
      sensorType: 'temperature',
      conditionOperator: '>',
      thresholdValue: 30,
      actionDevice: 'fan',
      actionStatus: true
    };

    it('should create a new automation rule', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(createMockPrismaGarden());

      const response = await request(app)
        .post(`/api/automation/${mockDevice.id}`)
        .send(newRule);

      expect(response.status).toBe(201);
      expect(response.body.data.rule).toMatchObject(newRule);
    });

    it('should return 404 for non-existent device', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/automation/non-existent-id')
        .send(newRule);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Device not found');
    });

    it('should return 400 for missing required fields', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(createMockPrismaGarden());

      const response = await request(app)
        .post(`/api/automation/${mockDevice.id}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Missing required fields');
    });
  });

  describe('PATCH /api/automation/:deviceId/rules/:ruleId', () => {
    it('should update an automation rule', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(createMockPrismaGarden());

      const response = await request(app)
        .patch(`/api/automation/${mockDevice.id}/rules/${mockRule.id}`)
        .send({
          thresholdValue: 35,
          isActive: false
        });

      expect(response.status).toBe(200);
      expect(response.body.data.rule.thresholdValue).toBe(35);
      expect(response.body.data.rule.isActive).toBe(false);
    });

    it('should return 404 for non-existent device', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .patch(`/api/automation/non-existent-id/rules/${mockRule.id}`)
        .send({ isActive: false });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Device not found');
    });

    it('should return 404 for non-existent rule', async () => {
      const mockGarden = createMockPrismaGarden();
      mockGarden.automationRules.findUnique.mockResolvedValue(null);
      prismaMock.garden.findUnique.mockResolvedValue(mockGarden);

      const response = await request(app)
        .patch(`/api/automation/${mockDevice.id}/rules/non-existent-id`)
        .send({ isActive: false });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Automation rule not found');
    });
  });

  describe('DELETE /api/automation/:deviceId/rules/:ruleId', () => {
    it('should delete an automation rule', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(createMockPrismaGarden());

      const response = await request(app)
        .delete(`/api/automation/${mockDevice.id}/rules/${mockRule.id}`);

      expect(response.status).toBe(204);
    });

    it('should return 404 for non-existent device', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete(`/api/automation/non-existent-id/rules/${mockRule.id}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Device not found');
    });

    it('should return 404 for non-existent rule', async () => {
      const mockGarden = createMockPrismaGarden();
      mockGarden.automationRules.findUnique.mockResolvedValue(null);
      prismaMock.garden.findUnique.mockResolvedValue(mockGarden);

      const response = await request(app)
        .delete(`/api/automation/${mockDevice.id}/rules/non-existent-id`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Automation rule not found');
    });
  });
}); 