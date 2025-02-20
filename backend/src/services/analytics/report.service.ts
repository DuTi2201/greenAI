import { Device, DeviceType } from '../../models/Device';
import { SensorData } from '../../models/SensorData';
import { Alert } from '../../models/Alert';
import { Op } from 'sequelize';
import { startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns';
import { geminiService } from '../ai/gemini.service';

interface WeeklyStats {
  startDate: Date;
  endDate: Date;
  energyUsage: {
    total: number;
    byDevice: {
      deviceId: string;
      deviceName: string;
      powerUsage: number;
      hoursActive: number;
    }[];
    previousWeek: number;
    prediction: number;
  };
  waterUsage: {
    total: number;
    byPump: {
      pumpId: string;
      pumpName: string;
      liters: number;
      hoursActive: number;
    }[];
    previousWeek: number;
    prediction: number;
  };
  sensorStats: {
    sensorId: string;
    sensorName: string;
    uptime: number;
    readings: number;
    accuracy: number;
  }[];
  recommendations: {
    title: string;
    description: string;
    savings: {
      energy?: number;
      water?: number;
    };
  }[];
}

class ReportService {
  async generateWeeklyStats(date: Date = new Date()): Promise<WeeklyStats> {
    const startDate = startOfWeek(date, { weekStartsOn: 1 }); // Bắt đầu từ thứ 2
    const endDate = endOfWeek(date, { weekStartsOn: 1 });
    const previousStartDate = subWeeks(startDate, 1);
    const previousEndDate = subWeeks(endDate, 1);

    // Lấy dữ liệu thiết bị
    const devices = await Device.findAll();
    const deviceActions = await this.getDeviceActions(startDate, endDate);
    const previousDeviceActions = await this.getDeviceActions(previousStartDate, previousEndDate);

    // Tính toán điện năng và nước tiêu thụ
    const energyUsage = await this.calculateEnergyUsage(devices, deviceActions);
    const previousEnergyUsage = await this.calculateEnergyUsage(devices, previousDeviceActions);
    const waterUsage = await this.calculateWaterUsage(devices, deviceActions);
    const previousWaterUsage = await this.calculateWaterUsage(devices, previousDeviceActions);

    // Tính toán hiệu suất cảm biến
    const sensorStats = await this.calculateSensorStats(devices, startDate, endDate);

    // Dự đoán cho tuần tới
    const nextWeekPrediction = await this.predictNextWeek(
      devices,
      [previousEnergyUsage.total, energyUsage.total],
      [previousWaterUsage.total, waterUsage.total]
    );

    // Tạo đề xuất
    const recommendations = await this.generateRecommendations(
      devices,
      energyUsage,
      waterUsage,
      nextWeekPrediction
    );

    return {
      startDate,
      endDate,
      energyUsage: {
        total: energyUsage.total,
        byDevice: energyUsage.byDevice,
        previousWeek: previousEnergyUsage.total,
        prediction: nextWeekPrediction.energy,
      },
      waterUsage: {
        total: waterUsage.total,
        byPump: waterUsage.byPump,
        previousWeek: previousWaterUsage.total,
        prediction: nextWeekPrediction.water,
      },
      sensorStats,
      recommendations,
    };
  }

  private async getDeviceActions(startDate: Date, endDate: Date) {
    // Lấy lịch sử hoạt động của thiết bị từ database
    // TODO: Implement device action logging
    return [];
  }

  private async calculateEnergyUsage(devices: Device[], actions: any[]) {
    const energyUsage = {
      total: 0,
      byDevice: [] as any[],
    };

    for (const device of devices) {
      if (device.type !== 'sensor' && device.metadata?.power) {
        const deviceActions = actions.filter(a => a.deviceId === device.id);
        const hoursActive = this.calculateActiveHours(deviceActions);
        const powerUsage = device.calculateEnergyConsumption(hoursActive);

        energyUsage.total += powerUsage;
        energyUsage.byDevice.push({
          deviceId: device.id,
          deviceName: device.name,
          powerUsage,
          hoursActive,
        });
      }
    }

    return energyUsage;
  }

  private async calculateWaterUsage(devices: Device[], actions: any[]) {
    const waterUsage = {
      total: 0,
      byPump: [] as any[],
    };

    for (const device of devices) {
      if (device.type === DeviceType.WATER_PUMP && device.metadata?.flowRate) {
        const pumpActions = actions.filter(a => a.deviceId === device.id);
        const minutesActive = this.calculateActiveMinutes(pumpActions);
        const liters = device.calculateWaterConsumption(minutesActive);

        waterUsage.total += liters;
        waterUsage.byPump.push({
          pumpId: device.id,
          pumpName: device.name,
          liters,
          hoursActive: minutesActive / 60,
        });
      }
    }

    return waterUsage;
  }

  private async calculateSensorStats(devices: Device[], startDate: Date, endDate: Date) {
    const stats = [];

    for (const device of devices) {
      if (device.type === 'sensor') {
        const readings = await SensorData.count({
          where: {
            deviceId: device.id,
            timestamp: {
              [Op.between]: [startDate, endDate],
            },
          },
        });

        // Tính uptime và accuracy dựa trên số lần đọc thành công
        const expectedReadings = 24 * 7 * 60; // Mỗi phút trong 1 tuần
        const uptime = (readings / expectedReadings) * 100;

        stats.push({
          sensorId: device.id,
          sensorName: device.name,
          uptime: Math.round(uptime * 10) / 10,
          readings,
          accuracy: 99.9, // TODO: Implement accuracy calculation
        });
      }
    }

    return stats;
  }

  private async predictNextWeek(
    devices: Device[],
    energyHistory: number[],
    waterHistory: number[]
  ) {
    // Dự đoán đơn giản dựa trên xu hướng
    const energyTrend = (energyHistory[1] - energyHistory[0]) / energyHistory[0];
    const waterTrend = (waterHistory[1] - waterHistory[0]) / waterHistory[0];

    return {
      energy: energyHistory[1] * (1 + energyTrend),
      water: waterHistory[1] * (1 + waterTrend),
    };
  }

  private async generateRecommendations(
    devices: Device[],
    energyUsage: any,
    waterUsage: any,
    prediction: any
  ) {
    const recommendations = [];

    // Kiểm tra thiết bị cần bảo trì
    const maintenanceDevices = devices.filter(d => {
      const lastMaintenance = d.metadata?.lastMaintenance;
      const maintenanceInterval = d.metadata?.maintenanceInterval;
      if (!lastMaintenance || !maintenanceInterval) return false;
      const nextMaintenance = new Date(lastMaintenance).getTime() + maintenanceInterval;
      return Date.now() > nextMaintenance;
    });
    if (maintenanceDevices.length > 0) {
      recommendations.push({
        title: 'Bảo trì thiết bị',
        description: `Các thiết bị sau cần được bảo trì: ${maintenanceDevices.map(d => d.name).join(', ')}`,
        savings: {},
      });
    }

    // Kiểm tra tiêu thụ điện cao
    if (prediction.energy > energyUsage.total * 1.1) {
      recommendations.push({
        title: 'Cảnh báo tiêu thụ điện',
        description: 'Dự kiến tuần tới tiêu thụ điện tăng > 10%. Xem xét điều chỉnh lịch hoạt động thiết bị.',
        savings: {
          energy: prediction.energy - energyUsage.total,
        },
      });
    }

    // Kiểm tra tiêu thụ nước cao
    if (prediction.water > waterUsage.total * 1.1) {
      recommendations.push({
        title: 'Cảnh báo tiêu thụ nước',
        description: 'Dự kiến tuần tới tiêu thụ nước tăng > 10%. Xem xét điều chỉnh lịch tưới.',
        savings: {
          water: prediction.water - waterUsage.total,
        },
      });
    }

    // Sử dụng Gemini AI để phân tích và đưa ra đề xuất thông minh
    try {
      const aiRecommendations = await geminiService.analyzeUsagePatterns({
        energy: energyUsage,
        water: waterUsage,
        prediction,
      });
      recommendations.push(...aiRecommendations);
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
    }

    return recommendations;
  }

  private calculateActiveHours(actions: any[]): number {
    // TODO: Implement actual calculation based on device actions
    return 24 * 7 * 0.3; // Giả định hoạt động 30% thời gian trong tuần
  }

  private calculateActiveMinutes(actions: any[]): number {
    // TODO: Implement actual calculation based on device actions
    return 24 * 7 * 60 * 0.1; // Giả định hoạt động 10% thời gian trong tuần
  }
}

export const reportService = new ReportService(); 