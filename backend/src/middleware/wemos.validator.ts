import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class WemosValidator {
  // Kiểm tra dữ liệu cảm biến
  static validateSensorData(req: Request, res: Response, next: NextFunction): void {
    const data = req.body;
    const errors = [];

    // Kiểm tra temperature
    if (typeof data.temperature !== 'number' || data.temperature < -50 || data.temperature > 100) {
      errors.push('Nhiệt độ không hợp lệ (phải từ -50°C đến 100°C)');
    }

    // Kiểm tra humidity
    if (typeof data.humidity !== 'number' || data.humidity < 0 || data.humidity > 100) {
      errors.push('Độ ẩm không hợp lệ (phải từ 0% đến 100%)');
    }

    // Kiểm tra soil_moisture
    if (typeof data.soil_moisture !== 'number' || data.soil_moisture < 0 || data.soil_moisture > 1023) {
      errors.push('Độ ẩm đất không hợp lệ (phải từ 0 đến 1023)');
    }

    // Kiểm tra light_intensity
    if (typeof data.light_intensity !== 'number' || data.light_intensity < 0 || data.light_intensity > 1023) {
      errors.push('Cường độ ánh sáng không hợp lệ (phải từ 0 đến 1023)');
    }

    // Kiểm tra trạng thái máy bơm
    if (typeof data.water_pump_state !== 'boolean') {
      errors.push('Trạng thái máy bơm nước không hợp lệ (phải là boolean)');
    }
    if (typeof data.nutrient_pump_state !== 'boolean') {
      errors.push('Trạng thái máy bơm dung dịch không hợp lệ (phải là boolean)');
    }

    if (errors.length > 0) {
      logger.error('Validation errors:', errors);
      res.status(400).json({ errors });
      return;
    }

    next();
  }

  // Kiểm tra dữ liệu cấu hình
  static validateConfig(req: Request, res: Response, next: NextFunction): void {
    const config = req.body;
    const errors = [];

    // Kiểm tra soil_moisture_threshold
    if (typeof config.soil_moisture_threshold !== 'number' || 
        config.soil_moisture_threshold < 0 || 
        config.soil_moisture_threshold > 1023) {
      errors.push('Ngưỡng độ ẩm đất không hợp lệ (phải từ 0 đến 1023)');
    }

    // Kiểm tra nutrient_interval
    if (typeof config.nutrient_interval !== 'number' || 
        config.nutrient_interval < 1000 || 
        config.nutrient_interval > 3600000) {
      errors.push('Khoảng thời gian bơm dung dịch không hợp lệ (phải từ 1 giây đến 1 giờ)');
    }

    // Kiểm tra nutrient_duration
    if (typeof config.nutrient_duration !== 'number' || 
        config.nutrient_duration < 100 || 
        config.nutrient_duration > 10000) {
      errors.push('Thời gian bơm dung dịch không hợp lệ (phải từ 0.1 đến 10 giây)');
    }

    // Kiểm tra water_pump_duration
    if (typeof config.water_pump_duration !== 'number' || 
        config.water_pump_duration < 100 || 
        config.water_pump_duration > 10000) {
      errors.push('Thời gian bơm nước không hợp lệ (phải từ 0.1 đến 10 giây)');
    }

    if (errors.length > 0) {
      logger.error('Validation errors:', errors);
      res.status(400).json({ errors });
      return;
    }

    next();
  }
} 