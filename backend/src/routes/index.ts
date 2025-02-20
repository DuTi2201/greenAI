import express from 'express';
import authRoutes from './auth.routes';
import deviceRoutes from './device.routes';
import sensorRoutes from './sensor.routes';
import alertRoutes from './alert.routes';
import reportRoutes from './report.routes';
import advisorRoutes from './advisor.routes';
import wemosRoutes from './wemos.routes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/devices', deviceRoutes);
router.use('/sensors', sensorRoutes);
router.use('/alerts', alertRoutes);
router.use('/reports', reportRoutes);
router.use('/advisors', advisorRoutes);
router.use('/wemos', wemosRoutes);

export default router; 