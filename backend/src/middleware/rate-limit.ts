import { Request, Response, NextFunction } from 'express';
import { Redis } from 'ioredis';
import { AppError } from './error';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface RateLimitOptions {
  windowMs: number; // Thời gian cửa sổ tính bằng mili giây
  max: number; // Số lượng request tối đa trong cửa sổ thời gian
  message?: string; // Thông báo lỗi
  keyGenerator?: (req: Request) => string; // Hàm tạo key
  skipInDevelopment?: boolean; // Bỏ qua rate limit trong môi trường phát triển
}

export const rateLimit = (options: RateLimitOptions) => {
  const windowMs = options.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // Mặc định 15 phút
  const max = options.max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'); // Mặc định 100 request
  const message = options.message || 'Quá nhiều request, vui lòng thử lại sau';
  const keyGenerator = options.keyGenerator || ((req: Request) => `rate-limit:${req.ip}`);
  const skipInDevelopment = options.skipInDevelopment !== undefined ? options.skipInDevelopment : true;

  return async (req: Request, _res: Response, next: NextFunction) => {
    // Bỏ qua rate limit trong môi trường phát triển nếu được cấu hình
    if (skipInDevelopment && process.env.NODE_ENV === 'development') {
      return next();
    }
    
    try {
      const key = keyGenerator(req);
      
      // Tăng số lượng request và lấy giá trị hiện tại
      const current = await redis.incr(key);
      
      // Nếu là request đầu tiên, set thời gian hết hạn
      if (current === 1) {
        await redis.pexpire(key, windowMs);
      }
      
      // Kiểm tra nếu vượt quá giới hạn
      if (current > max) {
        return next(new AppError(message, 429));
      }
      
      next();
    } catch (error) {
      // Nếu có lỗi với Redis, vẫn cho phép request đi qua
      console.error('Rate limit error:', error);
      next();
    }
  };
};

// Middleware giới hạn API chung
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 phút
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Giới hạn mỗi IP 100 request trong 15 phút
  message: 'Quá nhiều request từ IP này, vui lòng thử lại sau 15 phút',
  skipInDevelopment: true
});

// Middleware giới hạn API đăng nhập
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // Giới hạn mỗi IP 10 request đăng nhập trong 15 phút
  message: 'Quá nhiều yêu cầu đăng nhập từ IP này, vui lòng thử lại sau 15 phút',
  skipInDevelopment: true
});

// Middleware giới hạn API đăng ký
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 5, // Giới hạn mỗi IP 5 request đăng ký trong 1 giờ
  message: 'Quá nhiều yêu cầu đăng ký từ IP này, vui lòng thử lại sau 1 giờ',
  skipInDevelopment: true
}); 