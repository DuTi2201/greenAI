import { Router } from 'express';
import { db } from '../../singleton';
import { protect } from '../../middleware/auth';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validate';

const router = Router();

const plantSchema = z.object({
  name: z.string().min(1),
  optimalTemperatureMin: z.number(),
  optimalTemperatureMax: z.number(),
  optimalHumidityMin: z.number(),
  optimalHumidityMax: z.number(),
  optimalSoilMoistureMin: z.number(),
  optimalSoilMoistureMax: z.number(),
  optimalLightLevelMin: z.number(),
  optimalLightLevelMax: z.number(),
  description: z.string().optional(),
});

// Get all plants
router.get('/', protect, async (req, res) => {
  try {
    const plants = await db.plant.findMany();
    res.json(plants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plants' });
  }
});

// Get plant by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const plant = await db.plant.findUnique({
      where: { id: req.params.id },
      include: { plantGardens: true }
    });
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    res.json(plant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plant' });
  }
});

// Create new plant
router.post('/', protect, validateRequest(plantSchema), async (req, res) => {
  try {
    const plant = await db.plant.create({
      data: req.body
    });
    res.status(201).json(plant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create plant' });
  }
});

// Update plant
router.put('/:id', protect, validateRequest(plantSchema), async (req, res) => {
  try {
    const plant = await db.plant.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(plant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update plant' });
  }
});

// Delete plant
router.delete('/:id', protect, async (req, res) => {
  try {
    await db.plant.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete plant' });
  }
});

// Add plant to garden
router.post('/:plantId/gardens/:gardenId', protect, async (req, res) => {
  try {
    const plantGarden = await db.plantGarden.create({
      data: {
        plantId: req.params.plantId,
        gardenId: req.params.gardenId,
        notes: req.body.notes
      }
    });
    res.status(201).json(plantGarden);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add plant to garden' });
  }
});

export default router; 