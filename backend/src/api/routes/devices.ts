import { Router } from 'express';
import { protect } from '../../middleware/auth';
import { deviceService } from '../../services/device';
import { AppError } from '../../middleware/error';
import jwt from 'jsonwebtoken';
import { db } from '../../singleton';

const router = Router();

// Protect all routes
router.use(protect);

// Get all devices
router.get('/', async (req, res, next) => {
  try {
    const devices = await deviceService.getAllDevices(req.user!.id);
    res.json({
      status: 'success',
      data: { devices }
    });
  } catch (error) {
    next(error);
  }
});

// Get single device
router.get('/:id', async (req, res, next) => {
  try {
    const device = await deviceService.getDevice(req.params.id, req.user!.id);
    res.json({
      status: 'success',
      data: { device }
    });
  } catch (error) {
    next(error);
  }
});

// Create device
router.post('/', async (req, res, next) => {
  try {
    const { wemosSerial, name, location } = req.body;

    if (!wemosSerial || !name) {
      throw new AppError('Missing required fields', 400);
    }

    const device = await deviceService.createDevice({
      userId: req.user!.id,
      wemosSerial,
      name,
      location
    });

    res.status(201).json({
      status: 'success',
      data: { device }
    });
  } catch (error) {
    next(error);
  }
});

// Update device
router.patch('/:id', async (req, res, next) => {
  try {
    const { name, location, status } = req.body;
    const device = await deviceService.updateDevice(req.params.id, req.user!.id, {
      name,
      location,
      status
    });

    res.json({
      status: 'success',
      data: { device }
    });
  } catch (error) {
    next(error);
  }
});

// Delete device
router.delete('/:id', async (req, res, next) => {
  try {
    await deviceService.deleteDevice(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Control device
router.post('/:id/control', async (req, res, next) => {
  try {
    const { fanStatus, ledStatus, nutrientPumpStatus, waterPumpStatus } = req.body;
    const deviceStatus = await deviceService.controlDevice(req.params.id, req.user!.id, {
      fanStatus,
      ledStatus,
      nutrientPumpStatus,
      waterPumpStatus
    });

    res.json({
      status: 'success',
      data: { deviceStatus }
    });
  } catch (error) {
    next(error);
  }
});

// Device heartbeat endpoint
router.post('/:id/heartbeat', async (req, res, next) => {
  try {
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

    if (decoded.type !== 'device' || decoded.id !== req.params.id) {
      return next(new AppError('Unauthorized', 403));
    }

    // Update device last connected timestamp
    const device = await db.garden.update({
      where: { id: decoded.id },
      data: { lastConnected: new Date() }
    });

    if (!device) {
      return next(new AppError('Device not found', 404));
    }

    // Log heartbeat
    await db.systemLog.create({
      data: {
        gardenId: device.id,
        eventType: 'HEARTBEAT',
        description: `Received heartbeat from device ${device.wemosSerial}`,
        level: 'INFO'
      }
    });

    res.json({
      status: 'success',
      data: {
        message: 'Heartbeat received',
        timestamp: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get device control status (for Wemos device)
router.get('/control', async (req, res, next) => {
  try {
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
      return next(new AppError('Unauthorized', 403));
    }

    // Get the latest device status
    const deviceStatus = await db.deviceStatus.findFirst({
      where: { gardenId: decoded.id },
      orderBy: { updatedAt: 'desc' }
    });

    if (!deviceStatus) {
      // If no status exists, create a default one
      const newStatus = await db.deviceStatus.create({
        data: {
          gardenId: decoded.id,
          fanStatus: false,
          ledStatus: false,
          nutrientPumpStatus: false,
          waterPumpStatus: false
        }
      });

      return res.json({
        status: 'success',
        data: {
          ledStatus: newStatus.ledStatus,
          fanStatus: newStatus.fanStatus,
          nutrientPumpStatus: newStatus.nutrientPumpStatus,
          waterPumpStatus: newStatus.waterPumpStatus
        }
      });
    }

    res.json({
      status: 'success',
      data: {
        ledStatus: deviceStatus.ledStatus,
        fanStatus: deviceStatus.fanStatus,
        nutrientPumpStatus: deviceStatus.nutrientPumpStatus,
        waterPumpStatus: deviceStatus.waterPumpStatus
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 