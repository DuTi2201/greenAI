import request from 'supertest';
import { app } from '../app';
import { prisma } from '../prisma';
import { createTestUser, createTestToken } from './helpers';

describe('Plants API', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const user = await createTestUser();
    userId = user.id;
    token = createTestToken(userId);
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.plant.deleteMany();
  });

  describe('POST /api/plants', () => {
    it('should create a new plant', async () => {
      const plantData = {
        name: 'Test Plant',
        optimalTemperatureMin: 20,
        optimalTemperatureMax: 30,
        optimalHumidityMin: 40,
        optimalHumidityMax: 60,
        optimalSoilMoistureMin: 30,
        optimalSoilMoistureMax: 70,
        optimalLightLevelMin: 1000,
        optimalLightLevelMax: 10000,
        description: 'Test description',
      };

      const response = await request(app)
        .post('/api/plants')
        .set('Authorization', `Bearer ${token}`)
        .send(plantData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(plantData);
      expect(response.body.id).toBeDefined();
    });

    it('should validate plant data', async () => {
      const invalidData = {
        name: '',
        optimalTemperatureMin: -100,
        optimalTemperatureMax: 200,
      };

      const response = await request(app)
        .post('/api/plants')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/plants', () => {
    it('should return all plants', async () => {
      const response = await request(app)
        .get('/api/plants')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/plants/:id', () => {
    it('should return a specific plant', async () => {
      const plant = await prisma.plant.create({
        data: {
          name: 'Test Plant',
          optimalTemperatureMin: 20,
          optimalTemperatureMax: 30,
          optimalHumidityMin: 40,
          optimalHumidityMax: 60,
          optimalSoilMoistureMin: 30,
          optimalSoilMoistureMax: 70,
          optimalLightLevelMin: 1000,
          optimalLightLevelMax: 10000,
        },
      });

      const response = await request(app)
        .get(`/api/plants/${plant.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(plant.id);
    });

    it('should return 404 for non-existent plant', async () => {
      const response = await request(app)
        .get('/api/plants/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
}); 