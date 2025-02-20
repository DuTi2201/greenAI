import { Request, Response } from 'express';
import { SensorData } from '../models/SensorData';
import { Device } from '../models/Device';
import { Alert } from '../models/Alert';

const thresholds = {
  temperature: { min: 20, max: 30 },
  humidity: { min: 60, max: 80 },
  soilMoisture: { min: 50, max: 70 },
  light: { min: 400, max: 600 },
};

export const getLatestSensorData = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await SensorData.getLatest('main-sensor');
    if (!data) {
      res.status(404).json({ error: 'No sensor data available' });
      return;
    }

    // Chuyển đổi dữ liệu theo format frontend cần
    res.json({
      temperature: data.temperature,
      humidity: data.humidity,
      soilMoisture: data.soilMoisture,
      light: data.light,
      timestamp: data.timestamp,
    });
  } catch (error) {
    console.error('Error fetching latest sensor data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSensorData = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await SensorData.findAll({
      order: [['timestamp', 'DESC']],
      limit: 100,
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createSensorData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceId, temperature, humidity, soilMoisture, light } = req.body;

    // Validate device exists
    const device = await Device.findByPk(deviceId);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    // Create sensor data
    const data = await SensorData.create({
      deviceId,
      temperature,
      humidity,
      soilMoisture,
      light,
      timestamp: new Date(),
      metadata: {
        source: 'sensor',
        calibrated: true,
      },
    });

    // Check thresholds and create alerts if needed
    const checkAndCreateAlert = async (
      value: number,
      type: keyof typeof thresholds,
      deviceId: string
    ) => {
      const threshold = thresholds[type];
      if (value < threshold.min || value > threshold.max) {
        await Alert.create({
          deviceId,
          type: 'warning',
          message: `${type} (${value}) is outside normal range (${threshold.min}-${threshold.max})`,
          severity: value < threshold.min ? 'low' : 'high',
          status: 'active',
          metadata: {
            sensorValue: value,
            threshold: threshold,
            sensorType: type,
          },
        });
      }
    };

    // Check each sensor value
    await Promise.all([
      checkAndCreateAlert(temperature, 'temperature', deviceId),
      checkAndCreateAlert(humidity, 'humidity', deviceId),
      checkAndCreateAlert(soilMoisture, 'soilMoisture', deviceId),
      checkAndCreateAlert(light, 'light', deviceId),
    ]);

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating sensor data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 