import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types/auth.types';
import { User } from '../models/User';
import { logger } from '../utils/logger';

// Lấy JWT_SECRET từ biến môi trường
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

// Danh sách các route không cần xác thực
export const PUBLIC_ROUTES = ['/api/auth/login', '/api/auth/register', '/'];

interface JwtPayload {
  id: string;
  email: string;
  role?: string;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (PUBLIC_ROUTES.includes(req.path)) {
      return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
      }

      try {
        const payload = decoded as JwtPayload;
        const user = await User.findByPk(payload.id);
        
        if (!user) {
          return res.status(401).json({ message: 'Người dùng không tồn tại' });
        }

        req.user = {
          id: payload.id,
          email: payload.email,
          role: user.role // Lấy role từ database thay vì từ token
        };
        next();
      } catch (error) {
        logger.error('Error in authenticateToken:', error);
        return res.status(500).json({ message: 'Lỗi server' });
      }
    });
  } catch (error) {
    logger.error('Error in authenticateToken:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Không có quyền truy cập' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Không đủ quyền để thực hiện thao tác này' });
    }

    next();
  };
}; 