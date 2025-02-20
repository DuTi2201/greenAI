import { Router, RequestHandler } from 'express';
import { authenticateToken, authorize } from '../middleware/auth.middleware';
import {
  getAllDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  controlDevice,
} from '../controllers/device.controller';

const router = Router();

// Áp dụng middleware xác thực cho tất cả các routes
router.use(authenticateToken as RequestHandler);

// Routes không yêu cầu quyền admin
router.get('/', getAllDevices as RequestHandler);
router.get('/:id', getDeviceById as RequestHandler);
router.post('/:id/control', controlDevice as RequestHandler); // Cho phép user thường điều khiển thiết bị

// Routes yêu cầu quyền admin
router.post('/', authorize(['admin']) as RequestHandler, createDevice as RequestHandler);
router.put('/:id', authorize(['admin']) as RequestHandler, updateDevice as RequestHandler);
router.delete('/:id', authorize(['admin']) as RequestHandler, deleteDevice as RequestHandler);

export default router; 