import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../prisma';
import { createTestUser, createTestToken } from '../helpers';

describe('Automation API', () => {
  let token: string;
  let userId: string;
  let gardenId: string;

  beforeAll(async () => {
    const user = await createTestUser();
    userId = user.id;
    token = createTestToken(userId);

    const garden = await prisma.garden.create({
      data: {
        userId,
        name: 'Test Garden',
        wemosSerial: `WEMOS-${Date.now()}`,
        apiKey: `API-${Date.now()}`,
      },
    });
    gardenId = garden.id;
  });

  beforeEach(async () => {
    await prisma.automationRule.deleteMany();
  });

  describe('POST /api/automation/rules', () => {
    it('should create a new automation rule', async () => {
      const ruleData = {
        gardenId,
        sensorType: 'temperature',
        conditionOperator: '>',
        thresholdValue: 30,
        actionDevice: 'fan',
        actionStatus: true,
      };

      const response = await request(app)
        .post('/api/automation/rules')
        .set('Authorization', `Bearer ${token}`)
        .send(ruleData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(ruleData);
      expect(response.body.isActive).toBe(true);
    });

    it('should validate rule data', async () => {
      const response = await request(app)
        .post('/api/automation/rules')
        .set('Authorization', `Bearer ${token}`)
        .send({
          gardenId,
          sensorType: 'invalid-sensor',
          conditionOperator: 'invalid',
          thresholdValue: 'not-a-number',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/automation/rules/:gardenId', () => {
    beforeEach(async () => {
      await prisma.automationRule.createMany({
        data: [
          {
            gardenId,
            sensorType: 'temperature',
            conditionOperator: '>',
            thresholdValue: 30,
            actionDevice: 'fan',
            actionStatus: true,
          },
          {
            gardenId,
            sensorType: 'humidity',
            conditionOperator: '<',
            thresholdValue: 40,
            actionDevice: 'waterPump',
            actionStatus: true,
          },
        ],
      });
    });

    it('should return garden\'s automation rules', async () => {
      const response = await request(app)
        .get(`/api/automation/rules/${gardenId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('sensorType');
      expect(response.body[0].gardenId).toBe(gardenId);
    });
  });

  describe('PUT /api/automation/rules/:id', () => {
    let ruleId: string;

    beforeEach(async () => {
      const rule = await prisma.automationRule.create({
        data: {
          gardenId,
          sensorType: 'temperature',
          conditionOperator: '>',
          thresholdValue: 30,
          actionDevice: 'fan',
          actionStatus: true,
        },
      });
      ruleId = rule.id;
    });

    it('should update automation rule', async () => {
      const updateData = {
        thresholdValue: 25,
        actionStatus: false,
        isActive: false,
      };

      const response = await request(app)
        .put(`/api/automation/rules/${ruleId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(updateData);
    });
  });

  describe('DELETE /api/automation/rules/:id', () => {
    let ruleId: string;

    beforeEach(async () => {
      const rule = await prisma.automationRule.create({
        data: {
          gardenId,
          sensorType: 'temperature',
          conditionOperator: '>',
          thresholdValue: 30,
          actionDevice: 'fan',
          actionStatus: true,
        },
      });
      ruleId = rule.id;
    });

    it('should delete automation rule', async () => {
      const response = await request(app)
        .delete(`/api/automation/rules/${ruleId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);

      const rule = await prisma.automationRule.findUnique({
        where: { id: ruleId },
      });
      expect(rule).toBeNull();
    });
  });

  afterAll(async () => {
    await prisma.automationRule.deleteMany();
    await prisma.garden.deleteMany();
    await prisma.user.deleteMany();
  });
}); 