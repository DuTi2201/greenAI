import { Router, RequestHandler } from 'express';
import { register, login, verify } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register as RequestHandler);
router.post('/login', login as RequestHandler);
router.get('/verify', authenticateToken as RequestHandler, verify as RequestHandler);

export default router; 