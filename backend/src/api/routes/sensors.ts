import express from 'express';
import { protect } from '../../middleware/auth';
import { db } from '../../singleton';
import { AppError } from '../../middleware/error';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Protect all routes
router.use(protect);

// Get sensor data for a device
router.get('/:deviceId', async (req, res, next) => {
  try {
    const device = await db.garden.findUnique({
      where: {
        id: req.params.deviceId,
        userId: req.user!.id
      }
    });

    if (!device) {
      return next(new AppError('Device not found', 404));
    }

    const sensorData = await db.sensorData.findMany({
      where: { gardenId: device.id },
      orderBy: { recordedAt: 'desc' }
    });

    res.json({
      status: 'success',
      data: { sensorData }
    });
  } catch (error) {
    next(error);
  }
});

// Post new sensor data
router.post('/:deviceId', async (req, res, next) => {
  try {
    const { temperature, humidity, soilMoisture, lightLevel } = req.body;

    // Validate device ownership
    const device = await db.garden.findUnique({
      where: {
        id: req.params.deviceId,
        userId: req.user!.id
      }
    });

    if (!device) {
      return next(new AppError('Device not found', 404));
    }

    // Create sensor data record
    const sensorData = await db.sensorData.create({
      data: {
        gardenId: device.id,
        temperature,
        humidity,
        soilMoisture,
        lightLevel
      }
    });

    // Update device last connected timestamp
    await db.garden.update({
      where: { id: device.id },
      data: { lastConnected: new Date() }
    });

    res.status(201).json({
      status: 'success',
      data: { sensorData }
    });
  } catch (error) {
    next(error);
  }
});

// Post sensor data from Wemos device (no user authentication required)
router.post('/', async (req, res, next) => {
  try {
    const { temperature, humidity, soilMoisture, lightLevel, gardenId } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required', 401));
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; type: string };
    } catch (error) {
      return next(new AppError('Invalid token', 401));
    }

    if (decoded.type !== 'device') {
      return next(new AppError('Invalid token type', 401));
    }

    // If gardenId is provided, check if it matches the token
    if (gardenId && gardenId !== decoded.id) {
      return next(new AppError('Unauthorized access to this garden', 403));
    }

    // Find the device
    const device = await db.garden.findUnique({
      where: { id: decoded.id }
    });

    if (!device) {
      return next(new AppError('Device not found', 404));
    }

    // Create sensor data record
    const sensorData = await db.sensorData.create({
      data: {
        gardenId: device.id,
        temperature,
        humidity,
        soilMoisture,
        lightLevel
      }
    });

    // Update device last connected timestamp
    await db.garden.update({
      where: { id: device.id },
      data: { lastConnected: new Date() }
    });

    // Log sensor data received
    await db.systemLog.create({
      data: {
        gardenId: device.id,
        eventType: 'SENSOR_DATA',
        description: `Received sensor data from device ${device.wemosSerial}`,
        level: 'INFO'
      }
    });

    res.status(201).json({
      status: 'success',
      data: { sensorData }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 