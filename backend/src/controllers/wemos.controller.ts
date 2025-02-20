import { Request, Response } from 'express';
import { io } from '../index';
import { logger } from '../utils/logger';
import { Device, DeviceType, DeviceStatus } from '../models/Device';
import SensorData from '../models/SensorData';
import SystemConfig from '../models/SystemConfig';
import { CacheService } from '../services/cache.service';

export class WemosController {
  private cache: CacheService;
  private readonly CACHE_TTL = 5000; // 5 giây

  constructor() {
    this.cache = CacheService.getInstance();
  }

  // Nhận và lưu dữ liệu cảm biến
  async receiveSensorData(req: Request, res: Response): Promise<void> {
    try {
      const sensorData = req.body;
      
      // Tìm hoặc tạo Wemos device
      const [device] = await Device.findOrCreate({
        where: { type: DeviceType.WEMOS },
        defaults: {
          name: 'Wemos D1',
          type: DeviceType.WEMOS,
          status: DeviceStatus.ON,
          metadata: {
            description: 'Wemos D1 WiFi Controller',
            location: 'Garden'
          }
        }
      });

      // Lưu dữ liệu cảm biến
      const newSensorData = await SensorData.create({
        deviceId: device.id,
        timestamp: new Date(),
        temperature: sensorData.temperature,
        humidity: sensorData.humidity,
        soilMoisture: sensorData.soil_moisture,
        light: sensorData.light_intensity,
        waterPumpState: sensorData.water_pump_state,
        nutrientPumpState: sensorData.nutrient_pump_state
      });

      // Broadcast dữ liệu qua WebSocket
      io.emit('sensor_update', sensorData);
      
      logger.info('Received sensor data:', sensorData);
      res.status(200).json({ message: 'Data received successfully' });
    } catch (error) {
      logger.error('Error receiving sensor data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Trả về lệnh điều khiển
  async getControlCommands(req: Request, res: Response): Promise<void> {
    try {
      const device = await Device.findOne({
        where: { type: DeviceType.WEMOS }
      });

      if (!device) {
        res.status(404).json({ error: 'Wemos device not found' });
        return;
      }

      // Lấy trạng thái các thiết bị
      const waterPump = await Device.findOne({ where: { type: DeviceType.WATER_PUMP } });
      const nutrientPump = await Device.findOne({ where: { type: DeviceType.NUTRIENT_PUMP } });
      const led = await Device.findOne({ where: { type: DeviceType.LED } });
      const fan = await Device.findOne({ where: { type: DeviceType.FAN } });

      const commands = {
        pump1: waterPump?.status === DeviceStatus.ON,
        pump2: nutrientPump?.status === DeviceStatus.ON,
        led: led?.status === DeviceStatus.ON,
        fan: fan?.status === DeviceStatus.ON
      };
      
      res.status(200).json(commands);
    } catch (error) {
      logger.error('Error getting control commands:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Cập nhật cấu hình ngưỡng
  async updateConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = req.body;
      
      // Xóa cache cấu hình cũ
      this.cache.delete('system_config');

      const device = await Device.findOne({
        where: { type: DeviceType.WEMOS }
      });

      if (!device) {
        res.status(404).json({ error: 'Wemos device not found' });
        return;
      }

      // Cập nhật hoặc tạo mới cấu hình
      const [systemConfig] = await SystemConfig.upsert({
        deviceId: device.id,
        soilMoistureThreshold: config.soil_moisture_threshold,
        nutrientInterval: config.nutrient_interval,
        nutrientDuration: config.nutrient_duration,
        waterPumpDuration: config.water_pump_duration
      });

      // Lưu cấu hình mới vào cache
      this.cache.set('system_config', systemConfig, this.CACHE_TTL);
      
      logger.info('Updated system config:', config);
      res.status(200).json({ message: 'Config updated successfully' });
    } catch (error) {
      logger.error('Error updating config:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
} 