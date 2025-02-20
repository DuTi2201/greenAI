import { Router, RequestHandler } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  getSensorData,
  getLatestSensorData,
  createSensorData
} from '../controllers/sensor.controller';

const router = Router();

// Áp dụng middleware xác thực cho tất cả các routes
router.use(authenticateToken as RequestHandler);

router.get('/', getSensorData as RequestHandler);
router.get('/latest', getLatestSensorData as RequestHandler);
router.post('/', createSensorData as RequestHandler);

export default router; 