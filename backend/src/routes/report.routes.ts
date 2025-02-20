import { Router, RequestHandler } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  getWeeklyReport,
  sendWeeklyReportEmail,
  exportWeeklyReport
} from '../controllers/report.controller';

const router = Router();

// Áp dụng middleware xác thực cho tất cả các routes
router.use(authenticateToken as RequestHandler);

// Routes cho báo cáo
router.get('/weekly', getWeeklyReport as RequestHandler);
router.post('/weekly/email', sendWeeklyReportEmail as RequestHandler);
router.get('/export', exportWeeklyReport as RequestHandler);

export default router; 