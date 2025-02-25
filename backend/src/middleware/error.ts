import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import winston from 'winston';

// Cấu hình logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Xử lý lỗi từ Prisma
const handlePrismaError = (err: PrismaClientKnownRequestError) => {
  let message = 'Lỗi cơ sở dữ liệu';
  let statusCode = 500;

  switch (err.code) {
    case 'P2002': // Unique constraint failed
      message = `Trường ${err.meta?.target} đã tồn tại`;
      statusCode = 400;
      break;
    case 'P2025': // Record not found
      message = 'Không tìm thấy dữ liệu';
      statusCode = 404;
      break;
    case 'P2003': // Foreign key constraint failed
      message = 'Dữ liệu liên quan không tồn tại';
      statusCode = 400;
      break;
    case 'P2014': // Violation of a required relation
      message = 'Dữ liệu quan hệ bắt buộc bị thiếu';
      statusCode = 400;
      break;
    case 'P2004': // Constraint failed
      message = 'Dữ liệu vi phạm ràng buộc';
      statusCode = 400;
      break;
    default:
      logger.error('Prisma error:', { code: err.code, meta: err.meta, message: err.message });
  }

  return new AppError(message, statusCode);
};

// Xử lý lỗi từ Zod
const handleZodError = (err: ZodError) => {
  const errors = err.errors.map(e => ({
    path: e.path.join('.'),
    message: e.message
  }));
  
  return new AppError(`Lỗi xác thực dữ liệu: ${errors[0].message}`, 400);
};

// Xử lý lỗi JWT
const handleJWTError = () => new AppError('Token không hợp lệ. Vui lòng đăng nhập lại', 401);

// Xử lý lỗi JWT hết hạn
const handleJWTExpiredError = () => new AppError('Token đã hết hạn. Vui lòng đăng nhập lại', 401);

// Xử lý lỗi SyntaxError (JSON không hợp lệ)
const handleSyntaxError = (_err: SyntaxError) => new AppError('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại định dạng JSON', 400);

// Xử lý lỗi ValidationError (Mongoose)
const handleValidationError = (err: any) => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Dữ liệu không hợp lệ. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

export const errorHandler = (
  err: Error | AppError | ZodError | PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Ghi log lỗi
  logger.error('Error:', {
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });

  // Lỗi đã được xử lý
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // Lỗi từ Zod
  if (err instanceof ZodError) {
    const appError = handleZodError(err);
    return res.status(appError.statusCode).json({
      status: appError.status,
      message: appError.message
    });
  }

  // Lỗi từ Prisma
  if (err instanceof PrismaClientKnownRequestError) {
    const appError = handlePrismaError(err);
    return res.status(appError.statusCode).json({
      status: appError.status,
      message: appError.message
    });
  }

  // Lỗi JWT
  if (err.name === 'JsonWebTokenError') {
    const appError = handleJWTError();
    return res.status(appError.statusCode).json({
      status: appError.status,
      message: appError.message
    });
  }

  // Lỗi JWT hết hạn
  if (err.name === 'TokenExpiredError') {
    const appError = handleJWTExpiredError();
    return res.status(appError.statusCode).json({
      status: appError.status,
      message: appError.message
    });
  }

  // Lỗi SyntaxError (JSON không hợp lệ)
  if (err instanceof SyntaxError && 'body' in err) {
    const appError = handleSyntaxError(err);
    return res.status(appError.statusCode).json({
      status: appError.status,
      message: appError.message
    });
  }

  // Lỗi ValidationError (Mongoose)
  if (err.name === 'ValidationError') {
    const appError = handleValidationError(err);
    return res.status(appError.statusCode).json({
      status: appError.status,
      message: appError.message
    });
  }

  // Lỗi không xác định
  console.error('Unhandled error:', err);

  return res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Đã xảy ra lỗi. Vui lòng thử lại sau' 
      : err.message || 'Đã xảy ra lỗi'
  });
}; 