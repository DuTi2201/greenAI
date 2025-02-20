import { Router, RequestHandler } from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import {
  getAlerts,
  createAlert,
  updateAlertStatus,
  markAllAsRead,
} from '../controllers/alert.controller'

const router = Router()

// Áp dụng middleware xác thực cho tất cả các routes
router.use(authenticateToken as RequestHandler)

// GET /api/alerts - Lấy danh sách thông báo
router.get('/', getAlerts as RequestHandler)

// POST /api/alerts - Tạo thông báo mới
router.post('/', createAlert as RequestHandler)

// PUT /api/alerts/:id/status - Cập nhật trạng thái thông báo
router.put('/:id/status', updateAlertStatus as RequestHandler)

// PUT /api/alerts/mark-all-read - Đánh dấu tất cả thông báo là đã đọc
router.put('/mark-all-read', markAllAsRead as RequestHandler)

export default router 