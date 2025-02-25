import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../singleton';
import { AppError } from './error';
import { Redis } from 'ioredis';

// Khởi tạo Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        fullName: string | null;
      }
    }
  }
}

export const protect = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // 1) Check if token exists
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập.', 401)
      );
    }

    // 2) Kiểm tra xem token có trong blacklist không
    const isBlacklisted = await redis.get(`bl_${token}`);
    if (isBlacklisted) {
      return next(
        new AppError('Token đã bị vô hiệu hóa. Vui lòng đăng nhập lại.', 401)
      );
    }

    // 3) Verify token
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'test-secret'
      ) as { id: string };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return next(new AppError('Token đã hết hạn. Vui lòng đăng nhập lại.', 401));
      }
      return next(new AppError('Token không hợp lệ. Vui lòng đăng nhập lại.', 401));
    }

    // 4) Check if user still exists
    const user = await db.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true
      }
    });

    if (!user) {
      return next(
        new AppError('Người dùng thuộc token này không còn tồn tại.', 401)
      );
    }

    // 5) Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    return next(new AppError('Lỗi xác thực. Vui lòng đăng nhập lại.', 401));
  }
}; 