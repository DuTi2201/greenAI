import { db } from '../singleton';
import type { DeviceStatus } from '../types';
import { io } from '../server';
import type { Garden } from '../types';
import { AppError } from '../middleware/error';

interface DeviceControl {
  fanStatus?: boolean;
  ledStatus?: boolean;
  nutrientPumpStatus?: boolean;
  waterPumpStatus?: boolean;
}

/**
 * Điều khiển thiết bị
 * @param gardenId ID của thiết bị cần điều khiển
 * @param control Trạng thái các thiết bị con cần điều khiển
 * @returns Trạng thái mới của thiết bị
 */
export const controlDevice = async (
  gardenId: string,
  userId: string,
  control: DeviceControl
): Promise<DeviceStatus> => {
  // Kiểm tra device có tồn tại và thuộc về user không
  await deviceService.getDevice(gardenId, userId);

  // Lấy trạng thái hiện tại
  const currentStatus = await db.deviceStatus.findFirst({
    where: { gardenId },
    orderBy: { updatedAt: 'desc' }
  });

  // Tạo trạng thái mới
  const newStatus = await db.deviceStatus.create({
    data: {
      gardenId,
      fanStatus: control.fanStatus ?? currentStatus?.fanStatus ?? false,
      ledStatus: control.ledStatus ?? currentStatus?.ledStatus ?? false,
      nutrientPumpStatus: control.nutrientPumpStatus ?? currentStatus?.nutrientPumpStatus ?? false,
      waterPumpStatus: control.waterPumpStatus ?? currentStatus?.waterPumpStatus ?? false
    }
  });

  // Gửi thông báo qua socket.io
  io.to(gardenId).emit('deviceStatus', newStatus);

  return newStatus;
};

export const deviceService = {
  async getAllDevices(userId: string): Promise<Garden[]> {
    return db.garden.findMany({
      where: { userId },
      include: {
        deviceStatus: {
          take: 1,
          orderBy: { updatedAt: 'desc' }
        }
      }
    });
  },

  async getDevice(deviceId: string, userId: string): Promise<Garden> {
    const device = await db.garden.findUnique({
      where: {
        id: deviceId,
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
  }): Promise<Garden> {
    // Kiểm tra xem đã tồn tại device với wemosSerial này chưa
    const existingDevice = await db.garden.findFirst({
      where: { wemosSerial: data.wemosSerial }
    });

    if (existingDevice) {
      throw new AppError('Device with this serial already exists', 400);
    }

    // Tạo device mới
    const device = await db.garden.create({
      data: {
        userId: data.userId,
        wemosSerial: data.wemosSerial,
        name: data.name,
        location: data.location,
        apiKey: Math.random().toString(36).substring(2),
        status: 'active',
        lastConnected: new Date()
      },
      include: {
        deviceStatus: {
          take: 1,
          orderBy: { updatedAt: 'desc' }
        }
      }
    });

    // Tạo trạng thái mặc định cho device
    await db.deviceStatus.create({
      data: {
        gardenId: device.id,
        fanStatus: false,
        ledStatus: false,
        nutrientPumpStatus: false,
        waterPumpStatus: false
      }
    });

    return device;
  },

  async updateDevice(
    deviceId: string,
    userId: string,
    data: {
      name?: string;
      location?: string;
      status?: string;
    }
  ): Promise<Garden> {
    // Kiểm tra device có tồn tại và thuộc về user không
    const device = await this.getDevice(deviceId, userId);

    // Cập nhật device
    return db.garden.update({
      where: { id: deviceId },
      data: {
        name: data.name ?? device.name,
        location: data.location ?? device.location,
        status: data.status ?? device.status
      },
      include: {
        deviceStatus: {
          take: 1,
          orderBy: { updatedAt: 'desc' }
        }
      }
    });
  },

  async deleteDevice(deviceId: string, userId: string): Promise<void> {
    // Kiểm tra device có tồn tại và thuộc về user không
    await this.getDevice(deviceId, userId);

    // Xóa device
    await db.garden.delete({
      where: { id: deviceId }
    });
  },

  async controlDevice(
    deviceId: string,
    userId: string,
    control: DeviceControl
  ): Promise<DeviceStatus> {
    // Kiểm tra device có tồn tại và thuộc về user không
    await this.getDevice(deviceId, userId);

    // Lấy trạng thái hiện tại
    const currentStatus = await db.deviceStatus.findFirst({
      where: { gardenId: deviceId },
      orderBy: { updatedAt: 'desc' }
    });

    // Tạo trạng thái mới
    const newStatus = await db.deviceStatus.create({
      data: {
        gardenId: deviceId,
        fanStatus: control.fanStatus ?? currentStatus?.fanStatus ?? false,
        ledStatus: control.ledStatus ?? currentStatus?.ledStatus ?? false,
        nutrientPumpStatus: control.nutrientPumpStatus ?? currentStatus?.nutrientPumpStatus ?? false,
        waterPumpStatus: control.waterPumpStatus ?? currentStatus?.waterPumpStatus ?? false
      }
    });

    // Gửi thông báo qua socket.io
    io.to(deviceId).emit('deviceStatus', newStatus);

    return newStatus;
  },

  async getDeviceStatus(gardenId: string) {
    return db.deviceStatus.findFirst({
      where: { gardenId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        fanStatus: true,
        ledStatus: true,
        nutrientPumpStatus: true,
        waterPumpStatus: true,
        updatedAt: true
      }
    });
  },

  async updateDeviceStatus(gardenId: string, status: Partial<DeviceStatus>) {
    // Lưu trạng thái hiện tại vào lịch sử
    const currentStatus = await db.deviceStatus.findFirst({
      where: { gardenId },
      orderBy: { updatedAt: 'desc' },
      select: {
        fanStatus: true,
        ledStatus: true,
        nutrientPumpStatus: true,
        waterPumpStatus: true
      }
    });

    if (currentStatus) {
      // Chỉ lưu lịch sử nếu có thay đổi
      if (
        (status.fanStatus !== undefined && status.fanStatus !== currentStatus.fanStatus) ||
        (status.ledStatus !== undefined && status.ledStatus !== currentStatus.ledStatus) ||
        (status.nutrientPumpStatus !== undefined && status.nutrientPumpStatus !== currentStatus.nutrientPumpStatus) ||
        (status.waterPumpStatus !== undefined && status.waterPumpStatus !== currentStatus.waterPumpStatus)
      ) {
        await db.deviceStatusHistory.create({
          data: {
            gardenId,
            fanStatus: currentStatus.fanStatus,
            ledStatus: currentStatus.ledStatus,
            nutrientPumpStatus: currentStatus.nutrientPumpStatus,
            waterPumpStatus: currentStatus.waterPumpStatus
          }
        });
      }
    }

    // Cập nhật trạng thái mới
    return db.deviceStatus.create({
      data: {
        gardenId,
        ...status
      },
      select: {
        id: true,
        fanStatus: true,
        ledStatus: true,
        nutrientPumpStatus: true,
        waterPumpStatus: true,
        updatedAt: true
      }
    });
  }
}; 