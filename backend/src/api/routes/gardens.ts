import { Router } from 'express';
import { db } from '../../singleton';
import { protect } from '../../middleware/auth';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validate';
import crypto from 'crypto';
import { AppError } from '../../middleware/error';

const router = Router();

// Validate garden schema
const gardenSchema = z.object({
  name: z.string().min(1, 'Tên vườn không được để trống'),
  wemosSerial: z.string().min(1, 'Mã thiết bị không được để trống'),
  location: z.string().optional(),
  description: z.string().optional(),
  deviceType: z.string().optional(),
  firmwareVersion: z.string().optional(),
});

// Get all gardens for current user
router.get('/', protect, async (req, res) => {
  try {
    const gardens = await db.garden.findMany({
      where: {
        userId: req.user!.id,
      },
      include: {
        sensorData: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 1,
        },
        deviceStatus: true,
      },
    });

    res.json(gardens);
  } catch (error) {
    console.error('Failed to fetch gardens:', error);
    res.status(500).json({ error: 'Failed to fetch gardens' });
  }
});

// Get garden details
router.get('/:id', protect, async (req, res) => {
  try {
    const garden = await db.garden.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        sensorData: {
          orderBy: {
            recordedAt: 'desc',
          },
          take: 1,
        },
        deviceStatus: true,
        plantGardens: {
          include: {
            plant: true,
          },
        },
        automationRules: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!garden) {
      return res.status(404).json({ error: 'Garden not found' });
    }

    res.json(garden);
  } catch (error) {
    console.error('Failed to fetch garden:', error);
    res.status(500).json({ error: 'Failed to fetch garden' });
  }
});

// Create a new garden
router.post('/', validateRequest(z.object({
  body: z.object({
    name: z.string().min(1, 'Tên vườn không được để trống'),
    wemosSerial: z.string().min(1, 'Mã thiết bị không được để trống'),
    location: z.string().optional(),
  })
})), async (req, res, next) => {
  try {
    const { name, wemosSerial, location } = req.body;

    // Kiểm tra xem thiết bị đã được đăng ký chưa
    const existingGarden = await db.garden.findFirst({
      where: { wemosSerial }
    });

    if (existingGarden) {
      return next(new AppError('Thiết bị này đã được đăng ký. Mỗi thiết bị chỉ có thể kết nối với một người dùng.', 400));
    }

    // Tạo API key ngẫu nhiên
    const apiKey = crypto.randomBytes(32).toString('hex');

    // Tạo vườn mới
    const garden = await db.garden.create({
      data: {
        userId: req.user!.id,
        name,
        wemosSerial,
        location,
        apiKey,
        status: 'active',
        lastConnected: new Date()
      }
    });

    // Tạo trạng thái thiết bị mặc định
    await db.deviceStatus.create({
      data: {
        gardenId: garden.id,
        fanStatus: false,
        ledStatus: false,
        nutrientPumpStatus: false,
        waterPumpStatus: false
      }
    });

    // Ghi log
    await db.systemLog.create({
      data: {
        gardenId: garden.id,
        eventType: 'garden_created',
        description: `Garden "${name}" created with device ${wemosSerial}`,
        level: 'info'
      }
    });

    res.status(201).json({
      status: 'success',
      data: { garden }
    });
  } catch (error) {
    next(error);
  }
});

// Update garden
router.put('/:id', protect, validateRequest(z.object({ body: gardenSchema.partial() })), async (req, res) => {
  try {
    // Check if garden exists and belongs to user
    const existingGarden = await db.garden.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!existingGarden) {
      return res.status(404).json({ error: 'Garden not found' });
    }

    // If wemosSerial is being updated, check if it's unique
    if (req.body.wemosSerial && req.body.wemosSerial !== existingGarden.wemosSerial) {
      const duplicateSerial = await db.garden.findUnique({
        where: { wemosSerial: req.body.wemosSerial },
      });

      if (duplicateSerial) {
        return res.status(400).json({ error: 'Device with this serial number already exists' });
      }
    }

    const garden = await db.garden.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json(garden);
  } catch (error) {
    console.error('Failed to update garden:', error);
    res.status(500).json({ error: 'Failed to update garden' });
  }
});

// Delete garden
router.delete('/:id', protect, async (req, res) => {
  try {
    // Check if garden exists and belongs to user
    const existingGarden = await db.garden.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!existingGarden) {
      return res.status(404).json({ error: 'Garden not found' });
    }

    // Delete garden (cascade will handle related records)
    await db.garden.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete garden:', error);
    res.status(500).json({ error: 'Failed to delete garden' });
  }
});

// Get garden sensor data with pagination and filtering
router.get('/:id/sensor-data', protect, async (req, res) => {
  try {
    const { from, to, limit = '100', page = '1' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Check if garden exists and belongs to user
    const garden = await db.garden.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!garden) {
      return res.status(404).json({ error: 'Garden not found' });
    }

    // Build where clause for date filtering
    const whereClause: any = {
      gardenId: req.params.id,
    };

    if (from) {
      whereClause.recordedAt = {
        ...whereClause.recordedAt,
        gte: new Date(from as string),
      };
    }

    if (to) {
      whereClause.recordedAt = {
        ...whereClause.recordedAt,
        lte: new Date(to as string),
      };
    }

    // Get sensor data with pagination
    const [sensorData, total] = await Promise.all([
      db.sensorData.findMany({
        where: whereClause,
        orderBy: {
          recordedAt: 'desc',
        },
        skip,
        take: parseInt(limit as string),
      }),
      db.sensorData.count({
        where: whereClause,
      }),
    ]);

    res.json({
      data: sensorData,
      pagination: {
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
        currentPage: parseInt(page as string),
        limit: parseInt(limit as string),
      },
    });
  } catch (error) {
    console.error('Failed to fetch sensor data:', error);
    res.status(500).json({ error: 'Failed to fetch sensor data' });
  }
});

// Add new sensor data
router.post('/:id/sensor-data', protect, async (req, res) => {
  try {
    const { temperature, humidity, soilMoisture, lightLevel } = req.body;

    // Validate required fields
    if (temperature === undefined || humidity === undefined || 
        soilMoisture === undefined || lightLevel === undefined) {
      return res.status(400).json({ error: 'Missing required sensor data fields' });
    }

    // Check if garden exists and belongs to user
    const garden = await db.garden.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!garden) {
      return res.status(404).json({ error: 'Garden not found' });
    }

    // Create sensor data
    const sensorData = await db.sensorData.create({
      data: {
        gardenId: req.params.id,
        temperature,
        humidity,
        soilMoisture,
        lightLevel,
      },
    });

    // Update garden last connected timestamp
    await db.garden.update({
      where: { id: req.params.id },
      data: { lastConnected: new Date() },
    });

    res.status(201).json(sensorData);
  } catch (error) {
    console.error('Failed to create sensor data:', error);
    res.status(500).json({ error: 'Failed to create sensor data' });
  }
});

// Get garden growth data for a specific plant
router.get(
  '/:gardenId/plants/:plantId/growth',
  protect,
  validateRequest(
    z.object({
      query: z.object({
        startDate: z.string(),
        endDate: z.string(),
      }),
    })
  ),
  async (req, res) => {
    try {
      const { gardenId, plantId } = req.params;
      const { startDate, endDate } = req.query;

      // Verify garden belongs to user
      const garden = await db.garden.findFirst({
        where: {
          id: gardenId,
          userId: req.user!.id,
        },
      });

      if (!garden) {
        return res.status(404).json({ error: 'Garden not found' });
      }

      // Verify plant is in garden
      const plantGarden = await db.plantGarden.findFirst({
        where: {
          gardenId,
          plantId,
          status: 'active',
        },
      });

      if (!plantGarden) {
        return res.status(404).json({ error: 'Plant not found in garden' });
      }

      // Get sensor data for the period
      const sensorData = await db.sensorData.findMany({
        where: {
          gardenId,
          recordedAt: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string),
          },
        },
        orderBy: {
          recordedAt: 'asc',
        },
      });

      res.json(sensorData);
    } catch (error) {
      console.error('Failed to fetch growth data:', error);
      res.status(500).json({ error: 'Failed to fetch growth data' });
    }
  }
);

// Update device status
router.put('/:id/device-status', protect, async (req, res) => {
  try {
    const { fanStatus, ledStatus, nutrientPumpStatus, waterPumpStatus } = req.body;

    // Check if garden exists and belongs to user
    const garden = await db.garden.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!garden) {
      return res.status(404).json({ error: 'Garden not found' });
    }

    // Get current device status
    const currentStatus = await db.deviceStatus.findFirst({
      where: { gardenId: req.params.id },
    });

    // Update device status
    const deviceStatus = await db.deviceStatus.upsert({
      where: { 
        id: currentStatus?.id || '' 
      },
      create: {
        gardenId: req.params.id,
        fanStatus: fanStatus !== undefined ? fanStatus : false,
        ledStatus: ledStatus !== undefined ? ledStatus : false,
        nutrientPumpStatus: nutrientPumpStatus !== undefined ? nutrientPumpStatus : false,
        waterPumpStatus: waterPumpStatus !== undefined ? waterPumpStatus : false,
      },
      update: {
        fanStatus: fanStatus !== undefined ? fanStatus : currentStatus?.fanStatus,
        ledStatus: ledStatus !== undefined ? ledStatus : currentStatus?.ledStatus,
        nutrientPumpStatus: nutrientPumpStatus !== undefined ? nutrientPumpStatus : currentStatus?.nutrientPumpStatus,
        waterPumpStatus: waterPumpStatus !== undefined ? waterPumpStatus : currentStatus?.waterPumpStatus,
      },
    });

    // Record device status history
    await db.deviceStatusHistory.create({
      data: {
        gardenId: req.params.id,
        fanStatus: deviceStatus.fanStatus,
        ledStatus: deviceStatus.ledStatus,
        nutrientPumpStatus: deviceStatus.nutrientPumpStatus,
        waterPumpStatus: deviceStatus.waterPumpStatus,
      },
    });

    res.json(deviceStatus);
  } catch (error) {
    console.error('Failed to update device status:', error);
    res.status(500).json({ error: 'Failed to update device status' });
  }
});

export default router; 