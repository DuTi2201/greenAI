import { Router, RequestHandler } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { analyzeGardenData } from '../controllers/advisor/advisor.controller';
import { getAdvisorHistory } from '../controllers/advisor/history.controller';

const router = Router();

// Áp dụng middleware xác thực cho tất cả các routes
router.use(authenticateToken as RequestHandler);

router.post('/analyze', analyzeGardenData as RequestHandler);
router.get('/history', getAdvisorHistory as RequestHandler);

export default router; 