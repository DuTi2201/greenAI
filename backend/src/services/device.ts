import { prisma } from '../server';
import { AppError } from '../middleware/error';

export const deviceService = {
  async getAllDevices(userId: string) {
    return prisma.garden.findMany({
      where: { userId },
      include: {
        deviceStatus: {
          take: 1,
          orderBy: { updatedAt: 'desc' }
        }
      }
    });
  },

  async getDevice(id: string, userId: string) {
    const device = await prisma.garden.findUnique({
      where: {
        id,
        userId
      },
      include: {
        deviceStatus: {
          take: 1,
          orderBy: { updatedAt: 'desc' }
        },
        sensorData: {
          take: 1,
          orderBy: { recordedAt: 'desc' }
        }
      }
    });

    if (!device) {
      throw new AppError('Device not found', 404);
    }

    return device;
  },

  async createDevice(data: {
    userId: string;
    wemosSerial: string;
    name: string;
    location?: string;
  }) {
    const existingDevice = await prisma.garden.findUnique({
      where: { wemosSerial: data.wemosSerial }
    });

    if (existingDevice) {
      throw new AppError('Device with this serial already exists', 400);
    }

    return prisma.garden.create({
      data: {
        ...data,
        apiKey: Math.random().toString(36).substring(2, 15),
        status: 'active'
      }
    });
  },

  async updateDevice(id: string, userId: string, data: {
    name?: string;
    location?: string;
    status?: string;
  }) {
    await this.getDevice(id, userId);

    return prisma.garden.update({
      where: { id },
      data
    });
  },

  async deleteDevice(id: string, userId: string) {
    await this.getDevice(id, userId);

    await prisma.garden.delete({
      where: { id }
    });
  },

  async controlDevice(id: string, userId: string, data: {
    fanStatus?: boolean;
    ledStatus?: boolean;
    nutrientPumpStatus?: boolean;
    waterPumpStatus?: boolean;
  }) {
    await this.getDevice(id, userId);

    return prisma.deviceStatus.create({
      data: {
        gardenId: id,
        ...data
      }
    });
  }
}; 