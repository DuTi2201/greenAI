import { Request, Response, NextFunction } from 'express';
import csurf from 'csurf';
import { AppError } from './error';

// Mở rộng interface Request để thêm csrfToken
declare global {
  namespace Express {
    interface Request {
      csrfToken(): string;
    }
  }
}

// Mở rộng interface Error để thêm code
interface CSRFError extends Error {
  code?: string;
}

// Cấu hình CSRF
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Middleware xử lý lỗi CSRF
export const handleCSRFError = (
  err: CSRFError,
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return next(new AppError('Phiên làm việc không hợp lệ. Vui lòng thử lại', 403));
  }
  next(err);
};

// Middleware tạo token CSRF
export const generateCSRFToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.cookie('XSRF-TOKEN', req.csrfToken(), {
    httpOnly: false, // Cho phép JavaScript đọc token
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  next();
};

export { csrfProtection }; 