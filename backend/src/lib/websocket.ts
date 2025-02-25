import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import jwt from 'jsonwebtoken';
import { db } from '../singleton';
import { Redis } from 'ioredis';
import { processAutomationRules } from '../services/automation.service';

interface AuthenticatedSocket extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap> {
  userId?: string;
  deviceRooms: Set<string>;
}

// Khởi tạo Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Giới hạn số lượng kết nối cho mỗi user
const MAX_CONNECTIONS_PER_USER = 5;

// Lưu trữ số lượng kết nối của mỗi user
const userConnections: Record<string, number> = {};

export const setupWebSocket = (io: Server) => {
  // Authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback-secret'
      ) as { id: string };

      const user = await db.user.findUnique({
        where: { id: decoded.id }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      // Kiểm tra giới hạn kết nối
      if (userConnections[user.id] >= MAX_CONNECTIONS_PER_USER) {
        return next(new Error('Maximum connection limit reached'));
      }

      // Tăng số lượng kết nối
      userConnections[user.id] = (userConnections[user.id] || 0) + 1;

      (socket as AuthenticatedSocket).userId = user.id;
      (socket as AuthenticatedSocket).deviceRooms = new Set();
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Handle connections
  io.on('connection', (socket: Socket) => {
    const authenticatedSocket = socket as AuthenticatedSocket;
    console.log('Client connected:', authenticatedSocket.id);

    // Join device rooms
    authenticatedSocket.on('join-device', async (deviceId: string) => {
      try {
        // Verify device ownership
        const device = await db.garden.findUnique({
          where: {
            id: deviceId,
            userId: authenticatedSocket.userId
          }
        });

        if (!device) {
          authenticatedSocket.emit('error', 'Device not found or access denied');
          return;
        }

        const room = `device:${deviceId}`;
        authenticatedSocket.join(room);
        authenticatedSocket.deviceRooms.add(room);
        console.log(`Client ${authenticatedSocket.id} joined room ${room}`);

        // Gửi dữ liệu mới nhất cho client
        const [latestSensorData, latestDeviceStatus] = await Promise.all([
          db.sensorData.findFirst({
            where: { gardenId: deviceId },
            orderBy: { recordedAt: 'desc' }
          }),
          db.deviceStatus.findFirst({
            where: { gardenId: deviceId },
            orderBy: { updatedAt: 'desc' }
          })
        ]);

        if (latestSensorData) {
          authenticatedSocket.emit('sensor-update', {
            temperature: latestSensorData.temperature,
            humidity: latestSensorData.humidity,
            soilMoisture: latestSensorData.soilMoisture,
            lightLevel: latestSensorData.lightLevel,
            timestamp: latestSensorData.recordedAt
          });
        }

        if (latestDeviceStatus) {
          authenticatedSocket.emit('control-update', {
            fanStatus: latestDeviceStatus.fanStatus,
            ledStatus: latestDeviceStatus.ledStatus,
            nutrientPumpStatus: latestDeviceStatus.nutrientPumpStatus,
            waterPumpStatus: latestDeviceStatus.waterPumpStatus,
            timestamp: latestDeviceStatus.updatedAt
          });
        }
      } catch (error) {
        console.error('Error joining device room:', error);
        authenticatedSocket.emit('error', 'Failed to join device room');
      }
    });

    // Leave device rooms
    authenticatedSocket.on('leave-device', (deviceId: string) => {
      const room = `device:${deviceId}`;
      authenticatedSocket.leave(room);
      authenticatedSocket.deviceRooms.delete(room);
      console.log(`Client ${authenticatedSocket.id} left room ${room}`);
    });

    // Handle sensor data updates
    authenticatedSocket.on('sensor-data', async (data: {
      deviceId: string;
      temperature?: number;
      humidity?: number;
      soilMoisture?: number;
      lightLevel?: number;
    }) => {
      try {
        // Verify device ownership
        const device = await db.garden.findUnique({
          where: {
            id: data.deviceId,
            userId: authenticatedSocket.userId
          }
        });

        if (!device) {
          authenticatedSocket.emit('error', 'Device not found or access denied');
          return;
        }

        // Kiểm tra rate limiting
        const rateLimitKey = `sensor_data_rate:${data.deviceId}`;
        const rateLimited = await redis.get(rateLimitKey);
        
        if (rateLimited) {
          // Bỏ qua dữ liệu nếu gửi quá nhanh (dưới 5 giây)
          return;
        }
        
        // Set rate limit (5 giây)
        await redis.set(rateLimitKey, '1', 'EX', 5);

        // Save sensor data
        const sensorData = await db.sensorData.create({
          data: {
            gardenId: data.deviceId,
            temperature: data.temperature || 0,
            humidity: data.humidity || 0,
            soilMoisture: data.soilMoisture || 0,
            lightLevel: data.lightLevel || 0
          }
        });

        // Tối ưu hóa dữ liệu gửi đi
        const optimizedData = {
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          soilMoisture: sensorData.soilMoisture,
          lightLevel: sensorData.lightLevel,
          timestamp: sensorData.recordedAt
        };

        // Broadcast to room
        io.to(`device:${data.deviceId}`).emit('sensor-update', optimizedData);

        // Xử lý quy tắc tự động hóa
        await processAutomationRules(data.deviceId, {
          temperature: Number(data.temperature || 0),
          humidity: Number(data.humidity || 0),
          soilMoisture: Number(data.soilMoisture || 0),
          lightLevel: Number(data.lightLevel || 0)
        });
      } catch (error) {
        console.error('Error handling sensor data:', error);
        authenticatedSocket.emit('error', 'Failed to process sensor data');
      }
    });

    // Handle device control updates
    authenticatedSocket.on('device-control', async (data: {
      deviceId: string;
      fanStatus?: boolean;
      ledStatus?: boolean;
      nutrientPumpStatus?: boolean;
      waterPumpStatus?: boolean;
    }) => {
      try {
        // Verify device ownership
        const device = await db.garden.findUnique({
          where: {
            id: data.deviceId,
            userId: authenticatedSocket.userId
          }
        });

        if (!device) {
          authenticatedSocket.emit('error', 'Device not found or access denied');
          return;
        }

        // Kiểm tra rate limiting
        const rateLimitKey = `device_control_rate:${data.deviceId}`;
        const rateLimited = await redis.get(rateLimitKey);
        
        if (rateLimited) {
          // Bỏ qua lệnh nếu gửi quá nhanh (dưới 2 giây)
          authenticatedSocket.emit('error', 'Rate limit exceeded. Please wait before sending another command.');
          return;
        }
        
        // Set rate limit (2 giây)
        await redis.set(rateLimitKey, '1', 'EX', 2);

        // Update device status
        const deviceStatus = await db.deviceStatus.create({
          data: {
            gardenId: data.deviceId,
            fanStatus: data.fanStatus,
            ledStatus: data.ledStatus,
            nutrientPumpStatus: data.nutrientPumpStatus,
            waterPumpStatus: data.waterPumpStatus
          }
        });

        // Lưu lịch sử trạng thái thiết bị
        await db.deviceStatusHistory.create({
          data: {
            gardenId: data.deviceId,
            fanStatus: deviceStatus.fanStatus,
            ledStatus: deviceStatus.ledStatus,
            nutrientPumpStatus: deviceStatus.nutrientPumpStatus,
            waterPumpStatus: deviceStatus.waterPumpStatus
          }
        });

        // Tối ưu hóa dữ liệu gửi đi
        const optimizedData = {
          fanStatus: deviceStatus.fanStatus,
          ledStatus: deviceStatus.ledStatus,
          nutrientPumpStatus: deviceStatus.nutrientPumpStatus,
          waterPumpStatus: deviceStatus.waterPumpStatus,
          timestamp: deviceStatus.updatedAt
        };

        // Broadcast to room
        io.to(`device:${data.deviceId}`).emit('control-update', optimizedData);
      } catch (error) {
        console.error('Error handling device control:', error);
        authenticatedSocket.emit('error', 'Failed to update device control');
      }
    });

    // Handle disconnection
    authenticatedSocket.on('disconnect', () => {
      console.log('Client disconnected:', authenticatedSocket.id);
      
      // Giảm số lượng kết nối
      if (authenticatedSocket.userId) {
        userConnections[authenticatedSocket.userId]--;
        
        if (userConnections[authenticatedSocket.userId] <= 0) {
          delete userConnections[authenticatedSocket.userId];
        }
      }
      
      // Leave all device rooms
      authenticatedSocket.deviceRooms.forEach(room => authenticatedSocket.leave(room));
      authenticatedSocket.deviceRooms.clear();
    });
  });

  return io;
}; 