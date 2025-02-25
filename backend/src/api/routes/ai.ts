import { Router } from 'express';
import { protect } from '../../middleware/auth';
import { db } from '../../singleton';
import { AppError } from '../../middleware/error';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validate';
import { analyzePlantGrowth } from '../../services/ai-analysis';

const router = Router();

// Protect all routes
router.use(protect);

// Analyze plant growth
router.post(
  '/analyze-plant-growth',
  validateRequest(
    z.object({
      body: z.object({
        gardenId: z.string(),
        plantId: z.string(),
        startDate: z.string().transform(val => new Date(val)),
        endDate: z.string().transform(val => new Date(val)),
      }),
    })
  ),
  async (req, res, next) => {
    try {
      const { gardenId, plantId, startDate, endDate } = req.body;

      // Verify garden belongs to user
      const garden = await db.garden.findFirst({
        where: {
          id: gardenId,
          userId: req.user!.id,
        },
      });

      if (!garden) {
        return next(new AppError('Garden not found', 404));
      }

      // Verify plant exists
      const plant = await db.plant.findUnique({
        where: { id: plantId },
      });

      if (!plant) {
        return next(new AppError('Plant not found', 404));
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
        return next(new AppError('Plant not found in garden', 404));
      }

      // Analyze plant growth
      const analysis = await analyzePlantGrowth(gardenId, plantId, startDate, endDate);

      res.json({
        status: 'success',
        data: analysis,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'No data available for analysis') {
        return next(new AppError('No sensor data available for the selected period', 400));
      }
      next(error);
    }
  }
);

export default router; 