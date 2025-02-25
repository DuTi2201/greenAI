import request from 'supertest';
import { app } from '../../../app';
import { prismaMock } from '../../helpers/prisma-mock';
import { mockUser } from '../../helpers/mockData';
import jwt from 'jsonwebtoken';

const testDevice = {
  id: 'test-device-id',
  userId: mockUser.id,
  name: 'Test Device',
  wemosSerial: 'TEST123',
  apiKey: 'test-api-key',
  location: 'Test Location',
  description: 'Test Description',
  status: 'online',
  lastConnected: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  deviceStatus: [{
    id: 'test-status-id',
    gardenId: 'test-device-id',
    fanStatus: false,
    ledStatus: false,
    nutrientPumpStatus: false,
    waterPumpStatus: false,
    updatedAt: new Date()
  }],
  sensorData: [{
    id: 'test-sensor-id',
    gardenId: 'test-device-id',
    temperature: 25,
    humidity: 60,
    soilMoisture: 70,
    lightLevel: 800,
    recordedAt: new Date()
  }]
};

describe('Devices API Integration Tests', () => {
  let authToken: string;

  beforeAll(() => {
    authToken = jwt.sign({ userId: mockUser.id }, process.env.JWT_SECRET || 'test-secret');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock user authentication
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    // Mock device queries
    prismaMock.garden.findMany.mockResolvedValue([testDevice]);
    prismaMock.garden.findUnique.mockResolvedValue(testDevice);
    
    // Mock device creation
    prismaMock.garden.create.mockImplementation((args) => {
      const device = {
        ...testDevice,
        ...args.data,
        deviceStatus: [{
          id: 'new-status-id',
          gardenId: 'new-device-id',
          fanStatus: false,
          ledStatus: false,
          nutrientPumpStatus: false,
          waterPumpStatus: false,
          updatedAt: new Date()
        }]
      };
      return Promise.resolve(device);
    });

    // Mock device update
    prismaMock.garden.update.mockImplementation((args) => {
      const device = {
        ...testDevice,
        ...args.data,
        deviceStatus: [{
          id: 'updated-status-id',
          gardenId: testDevice.id,
          fanStatus: false,
          ledStatus: false,
          nutrientPumpStatus: false,
          waterPumpStatus: false,
          updatedAt: new Date()
        }]
      };
      return Promise.resolve(device);
    });
  });

  describe('GET /api/devices', () => {
    it('should return all devices for authenticated user', async () => {
      const response = await request(app)
        .get('/api/devices')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.devices).toHaveLength(1);
      expect(response.body.data.devices[0].id).toBe(testDevice.id);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/devices');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Authentication required');
    });
  });

  describe('GET /api/devices/:id', () => {
    it('should return a specific device', async () => {
      const response = await request(app)
        .get(`/api/devices/${testDevice.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.device.id).toBe(testDevice.id);
    });

    it('should return 404 for non-existent device', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/devices/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Device not found');
    });
  });

  describe('POST /api/devices', () => {
    it('should create a new device', async () => {
      const newDevice = {
        name: 'New Device',
        wemosSerial: 'NEW123',
        location: 'New Location',
        description: 'New Description'
      };

      const response = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newDevice);

      expect(response.status).toBe(201);
      expect(response.body.data.device.name).toBe(newDevice.name);
      expect(response.body.data.device.wemosSerial).toBe(newDevice.wemosSerial);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Missing required fields');
    });
  });

  describe('PUT /api/devices/:id', () => {
    it('should update a device', async () => {
      const updateData = {
        name: 'Updated Device',
        location: 'Updated Location'
      };

      const response = await request(app)
        .put(`/api/devices/${testDevice.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.device.name).toBe(updateData.name);
      expect(response.body.data.device.location).toBe(updateData.location);
    });

    it('should return 404 for non-existent device', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/devices/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Device' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Device not found');
    });
  });

  describe('DELETE /api/devices/:id', () => {
    it('should delete a device', async () => {
      const response = await request(app)
        .delete(`/api/devices/${testDevice.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);
    });

    it('should return 404 for non-existent device', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/devices/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Device not found');
    });
  });
});