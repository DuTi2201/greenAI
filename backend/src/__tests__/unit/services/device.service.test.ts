import { prismaMock } from '../../helpers/prisma-mock';
import { deviceService } from '../../../services/device.service';
import { AppError } from '../../../middleware/error';
import type { Garden, DeviceStatus } from '../../../types';

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  passwordHash: 'hashed_password',
  fullName: 'Test User',
  preferredLanguage: 'vi',
  themePreference: 'light',
  phoneNumber: null,
  dateOfBirth: null,
  resetToken: null,
  resetTokenExpiry: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockDeviceStatus: DeviceStatus = {
  id: 'test-status-id',
  gardenId: 'test-device-id',
  fanStatus: false,
  ledStatus: false,
  nutrientPumpStatus: false,
  waterPumpStatus: false,
  updatedAt: new Date()
};

const mockDevice: Garden = {
  id: 'test-device-id',
  userId: mockUser.id,
  name: 'Test Device',
  wemosSerial: 'TEST123',
  apiKey: 'test-api-key',
  location: 'Test Location',
  description: 'Test device description',
  status: 'online',
  lastConnected: new Date(),
  deviceType: 'ESP8266',
  firmwareVersion: '1.0.0',
  createdAt: new Date(),
  updatedAt: new Date()
};

type MockGarden = Garden & {
  deviceStatus: DeviceStatus[];
};

const mockGardenWithStatus: MockGarden = {
  ...mockDevice,
  deviceStatus: [mockDeviceStatus]
};

describe('Device Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllDevices', () => {
    it('should return all devices for a user', async () => {
      (prismaMock.garden.findMany as jest.Mock).mockResolvedValue([mockGardenWithStatus]);

      const devices = await deviceService.getAllDevices(mockUser.id);

      expect(devices).toHaveLength(1);
      expect(devices[0].id).toBe(mockDevice.id);
    });
  });

  describe('getDevice', () => {
    it('should return a specific device', async () => {
      (prismaMock.garden.findUnique as jest.Mock).mockResolvedValue(mockGardenWithStatus);

      const device = await deviceService.getDevice(mockDevice.id, mockUser.id);

      expect(device.id).toBe(mockDevice.id);
      expect(device.userId).toBe(mockUser.id);
    });

    it('should throw error if device not found', async () => {
      (prismaMock.garden.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(deviceService.getDevice('non-existent-id', mockUser.id))
        .rejects
        .toThrow(new AppError('Device not found', 404));
    });

    it('should throw error if device belongs to different user', async () => {
      (prismaMock.garden.findUnique as jest.Mock).mockResolvedValue({
        ...mockGardenWithStatus,
        userId: 'different-user-id'
      });

      await expect(deviceService.getDevice(mockDevice.id, mockUser.id))
        .rejects
        .toThrow(new AppError('Device not found', 404));
    });
  });

  describe('createDevice', () => {
    it('should create a new device', async () => {
      const newDeviceData = {
        userId: mockUser.id,
        name: 'New Device',
        wemosSerial: 'NEW123',
        location: 'New Location'
      };

      (prismaMock.garden.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaMock.garden.create as jest.Mock).mockResolvedValue(mockGardenWithStatus);
      (prismaMock.deviceStatus.create as jest.Mock).mockResolvedValue(mockDeviceStatus);

      const device = await deviceService.createDevice(newDeviceData);

      expect(device.name).toBe(mockDevice.name);
      expect(device.wemosSerial).toBe(mockDevice.wemosSerial);
      expect(device.userId).toBe(mockUser.id);
    });

    it('should throw error if device with serial exists', async () => {
      const newDeviceData = {
        userId: mockUser.id,
        name: 'New Device',
        wemosSerial: mockDevice.wemosSerial,
        location: 'New Location'
      };

      (prismaMock.garden.findFirst as jest.Mock).mockResolvedValue(mockGardenWithStatus);

      await expect(deviceService.createDevice(newDeviceData))
        .rejects
        .toThrow(new AppError('Device with this serial already exists', 400));
    });
  });

  describe('updateDevice', () => {
    it('should update a device', async () => {
      const updateData = {
        name: 'Updated Device',
        location: 'Updated Location'
      };

      (prismaMock.garden.findUnique as jest.Mock).mockResolvedValue(mockGardenWithStatus);
      (prismaMock.garden.update as jest.Mock).mockResolvedValue({
        ...mockGardenWithStatus,
        ...updateData
      });

      const device = await deviceService.updateDevice(mockDevice.id, mockUser.id, updateData);

      expect(device.name).toBe(updateData.name);
      expect(device.location).toBe(updateData.location);
    });

    it('should throw error if device not found', async () => {
      (prismaMock.garden.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(deviceService.updateDevice('non-existent-id', mockUser.id, { name: 'Updated' }))
        .rejects
        .toThrow(new AppError('Device not found', 404));
    });
  });

  describe('deleteDevice', () => {
    it('should delete a device', async () => {
      (prismaMock.garden.findUnique as jest.Mock).mockResolvedValue(mockGardenWithStatus);
      (prismaMock.garden.delete as jest.Mock).mockResolvedValue(mockGardenWithStatus);

      await expect(deviceService.deleteDevice(mockDevice.id, mockUser.id))
        .resolves
        .not.toThrow();
    });

    it('should throw error if device not found', async () => {
      (prismaMock.garden.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(deviceService.deleteDevice('non-existent-id', mockUser.id))
        .rejects
        .toThrow(new AppError('Device not found', 404));
    });
  });

  describe('controlDevice', () => {
    const controlData = {
      fanStatus: true,
      ledStatus: true
    };

    it('should update device status', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(mockGardenWithStatus);
      prismaMock.deviceStatus.findFirst.mockResolvedValue(mockDeviceStatus);
      prismaMock.deviceStatus.create.mockResolvedValue({
        id: 'new-status-id',
        gardenId: '1',
        ...controlData,
        nutrientPumpStatus: false,
        waterPumpStatus: false,
        updatedAt: new Date()
      });

      const result = await deviceService.controlDevice('1', 'user-1', controlData);
      expect(result).toMatchObject({
        gardenId: '1',
        ...controlData
      });
    });

    it('should throw error when device not found', async () => {
      prismaMock.garden.findUnique.mockResolvedValue(null);

      await expect(deviceService.controlDevice('1', 'user-1', controlData)).rejects.toThrow(
        new AppError('Device not found', 404)
      );
    });
  });
}); 