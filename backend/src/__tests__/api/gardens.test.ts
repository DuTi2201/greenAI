import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../prisma';
import { createTestUser, createTestToken } from '../helpers';

describe('Gardens API', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const user = await createTestUser();
    userId = user.id;
    token = createTestToken(userId);
  });

  beforeEach(async () => {
    await prisma.garden.deleteMany();
  });

  describe('POST /api/gardens', () => {
    it('should create a new garden', async () => {
      const gardenData = {
        name: 'Test Garden',
        wemosSerial: `WEMOS-${Date.now()}`,
        location: 'Backyard',
        description: 'My test garden',
      };

      const response = await request(app)
        .post('/api/gardens')
        .set('Authorization', `Bearer ${token}`)
        .send(gardenData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        ...gardenData,
        userId,
        status: 'active',
      });
      expect(response.body.apiKey).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/gardens')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '', // Empty name
          wemosSerial: '', // Empty serial
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/gardens', () => {
    beforeEach(async () => {
      await prisma.garden.createMany({
        data: [
          {
            userId,
            name: 'Garden 1',
            wemosSerial: `WEMOS-1-${Date.now()}`,
            apiKey: `API-1-${Date.now()}`,
          },
          {
            userId,
            name: 'Garden 2',
            wemosSerial: `WEMOS-2-${Date.now()}`,
            apiKey: `API-2-${Date.now()}`,
          },
        ],
      });
    });

    it('should return user\'s gardens', async () => {
      const response = await request(app)
        .get('/api/gardens')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0].userId).toBe(userId);
    });
  });

  describe('GET /api/gardens/:id', () => {
    let gardenId: string;

    beforeEach(async () => {
      const garden = await prisma.garden.create({
        data: {
          userId,
          name: 'Test Garden',
          wemosSerial: `WEMOS-${Date.now()}`,
          apiKey: `API-${Date.now()}`,
        },
      });
      gardenId = garden.id;

      // Add some sensor data
      await prisma.sensorData.create({
        data: {
          gardenId,
          temperature: 25,
          humidity: 60,
          soilMoisture: 70,
          lightLevel: 1000,
        },
      });
    });

    it('should return garden details with latest sensor data', async () => {
      const response = await request(app)
        .get(`/api/gardens/${gardenId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(gardenId);
      expect(response.body.sensorData).toHaveLength(1);
      expect(response.body.sensorData[0].temperature).toBe(25);
    });

    it('should not allow access to other user\'s garden', async () => {
      const otherUser = await createTestUser();
      const otherToken = createTestToken(otherUser.id);

      const response = await request(app)
        .get(`/api/gardens/${gardenId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/gardens/:id', () => {
    let gardenId: string;

    beforeEach(async () => {
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

    it('should update garden details', async () => {
      const updateData = {
        name: 'Updated Garden',
        location: 'Front Yard',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/gardens/${gardenId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(updateData);
    });
  });

  afterAll(async () => {
    await prisma.sensorData.deleteMany();
    await prisma.garden.deleteMany();
    await prisma.user.deleteMany();
  });
}); 