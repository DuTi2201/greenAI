import { Router } from 'express';
import { db } from '../../singleton';
import { protect } from '../../middleware/auth';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validate';

const router = Router();

const logSchema = z.object({
  eventType: z.string(),
  description: z.string(),
  level: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']),
});

// Get logs by garden ID
router.get('/garden/:gardenId', protect, async (req, res) => {
  try {
    const { page = 1, limit = 50, level } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      gardenId: req.params.gardenId,
      ...(level ? { level: level.toString() } : {}),
    };

    const [logs, total] = await Promise.all([
      db.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      db.systemLog.count({ where }),
    ]);

    res.json({
      data: logs,
      pagination: {
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Create new log
router.post('/garden/:gardenId', protect, validateRequest(logSchema), async (req, res) => {
  try {
    const log = await db.systemLog.create({
      data: {
        ...req.body,
        gardenId: req.params.gardenId,
      },
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create log' });
  }
});

// Delete logs older than X days
router.delete('/garden/:gardenId', protect, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const date = new Date();
    date.setDate(date.getDate() - Number(days));

    const result = await db.systemLog.deleteMany({
      where: {
        gardenId: req.params.gardenId,
        createdAt: {
          lt: date,
        },
      },
    });

    res.json({ deletedCount: result.count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete logs' });
  }
});

export default router; 