import express from 'express';
import { db } from '../../singleton';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { protect } from '../../middleware/auth';
import { sendResetPasswordEmail, sendTestEmail } from '../../services/email.service';
import crypto from 'crypto';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validate';
import { AppError } from '../../middleware/error';
import { Redis } from 'ioredis';
import { loginLimiter, registerLimiter } from '../../middleware/rate-limit';
import { csrfProtection, generateCSRFToken } from '../../middleware/csrf';

const router = express.Router();

// Khởi tạo Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Cập nhật schema đăng ký với yêu cầu mật khẩu mạnh hơn
const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
    .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
    .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số')
    .regex(/[^A-Za-z0-9]/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt'),
  fullName: z.string().min(1, 'Họ tên không được để trống'),
  preferredLanguage: z.string().default('en'),
  themePreference: z.string().default('light'),
  role: z.enum(['user', 'admin']).default('user'),
});

// Endpoint để lấy CSRF token
router.get('/csrf-token', csrfProtection, generateCSRFToken, (req, res) => {
  res.json({
    status: 'success',
    message: 'CSRF token đã được tạo'
  });
});

// Endpoint để kiểm tra token
router.get('/validate', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Không tìm thấy token xác thực', 401));
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string, type?: string };
      
      // Nếu là token thiết bị
      if (decoded.type === 'device') {
        const device = await db.garden.findUnique({
          where: { id: decoded.id }
        });
        
        if (!device) {
          return next(new AppError('Thiết bị không tồn tại', 404));
        }
        
        return res.json({
          status: 'success',
          data: {
            valid: true,
            device: {
              id: device.id,
              name: device.name,
              wemosSerial: device.wemosSerial
            }
          }
        });
      }
      
      // Nếu là token người dùng
      const user = await db.user.findUnique({
        where: { id: decoded.id }
      });
      
      if (!user) {
        return next(new AppError('Người dùng không tồn tại', 404));
      }
      
      res.json({
        status: 'success',
        data: {
          valid: true,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            isActive: user.isActive,
            preferredLanguage: user.preferredLanguage,
            themePreference: user.themePreference
          }
        }
      });
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return next(new AppError('Token đã hết hạn', 401));
      }
      return next(new AppError('Token không hợp lệ', 401));
    }
  } catch (error) {
    next(error);
  }
});

// Endpoint để làm mới token
router.post('/refresh-token', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Không tìm thấy token xác thực', 401));
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', 
        { ignoreExpiration: true }) as { id: string, type?: string, exp: number };
      
      // Kiểm tra xem token đã hết hạn quá lâu chưa (quá 7 ngày)
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp && currentTime > decoded.exp + 7 * 24 * 60 * 60) {
        return next(new AppError('Token đã hết hạn quá lâu, vui lòng đăng nhập lại', 401));
      }
      
      // Nếu là token thiết bị
      if (decoded.type === 'device') {
        const device = await db.garden.findUnique({
          where: { id: decoded.id }
        });
        
        if (!device) {
          return next(new AppError('Thiết bị không tồn tại', 404));
        }
        
        // Tạo token mới
        const newToken = jwt.sign(
          { id: device.id, type: 'device' },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '30d' }
        );
        
        return res.json({
          status: 'success',
          token: newToken,
          device: {
            id: device.id,
            name: device.name
          }
        });
      }
      
      // Nếu là token người dùng
      const user = await db.user.findUnique({
        where: { id: decoded.id }
      });
      
      if (!user) {
        return next(new AppError('Người dùng không tồn tại', 404));
      }
      
      // Tạo token mới
      const newToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      res.json({
        status: 'success',
        token: newToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isActive: user.isActive,
          preferredLanguage: user.preferredLanguage,
          themePreference: user.themePreference
        }
      });
    } catch (error) {
      return next(new AppError('Token không hợp lệ', 401));
    }
  } catch (error) {
    next(error);
  }
});

// Đăng ký tài khoản mới
router.post('/register', registerLimiter, csrfProtection, validateRequest(z.object({ body: registerSchema })), async (req, res, next) => {
  try {
    const data = req.body;
    console.log('Dữ liệu đăng ký nhận được:', JSON.stringify(data));

    // Kiểm tra email đã tồn tại
    const existingUser = await db.user.findUnique({
      where: { email: data.email }
    });
    
    console.log('Kết quả kiểm tra email:', JSON.stringify({ email: data.email, exists: !!existingUser }));

    if (existingUser) {
      return next(new AppError('Email đã tồn tại', 400));
    }

    // Mã hóa mật khẩu
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Tạo user mới - loại bỏ trường password từ data
    const { password, ...userData } = data;
    const user = await db.user.create({
      data: {
        ...userData,
        passwordHash,
        isActive: true
      }
    });

    // Tạo token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isActive: user.isActive,
          preferredLanguage: user.preferredLanguage,
          themePreference: user.themePreference
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// Đăng nhập
router.post('/login', loginLimiter, csrfProtection, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Thiếu email hoặc mật khẩu', 400));
    }

    // Kiểm tra số lần đăng nhập sai
    const loginAttemptsKey = `login_attempts:${email}`;
    const loginAttempts = await redis.get(loginAttemptsKey);
    
    if (loginAttempts && parseInt(loginAttempts) >= 5) {
      return next(new AppError('Tài khoản đã bị khóa tạm thời do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.', 429));
    }

    // Tìm user theo email
    const user = await db.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Tăng số lần đăng nhập sai
      await redis.incr(loginAttemptsKey);
      // Set thời gian hết hạn cho key (15 phút)
      await redis.expire(loginAttemptsKey, 15 * 60);
      
      return next(new AppError('Email hoặc mật khẩu không đúng', 401));
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      // Tăng số lần đăng nhập sai
      await redis.incr(loginAttemptsKey);
      // Set thời gian hết hạn cho key (15 phút)
      await redis.expire(loginAttemptsKey, 15 * 60);
      
      return next(new AppError('Email hoặc mật khẩu không đúng', 401));
    }

    // Đăng nhập thành công, xóa key đếm số lần đăng nhập sai
    await redis.del(loginAttemptsKey);

    // Tạo token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isActive: user.isActive,
          preferredLanguage: user.preferredLanguage,
          themePreference: user.themePreference
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// Yêu cầu đặt lại mật khẩu
router.post('/forgot-password', csrfProtection, validateRequest(z.object({
  body: z.object({
    email: z.string().email('Email không hợp lệ')
  })
})), async (req, res, next) => {
  try {
    const { email } = req.body;

    // Tìm user theo email
    const user = await db.user.findUnique({
      where: { email }
    });

    if (!user) {
      return next(new AppError('Không tìm thấy người dùng với email này', 404));
    }

    // Tạo token reset password
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 giờ

    // Lưu token vào database
    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Gửi email reset password
    await sendResetPasswordEmail(user.email, resetToken);

    res.json({
      status: 'success',
      message: 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn'
    });
  } catch (error) {
    next(error);
  }
});

// Đặt lại mật khẩu
router.post('/reset-password', csrfProtection, validateRequest(z.object({
  body: z.object({
    token: z.string(),
    newPassword: z.string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
      .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
      .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số')
      .regex(/[^A-Za-z0-9]/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt')
  })
})), async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    // Tìm user với token hợp lệ
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return next(new AppError('Token không hợp lệ hoặc đã hết hạn', 400));
    }

    // Mã hóa mật khẩu mới
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Cập nhật mật khẩu và xóa token
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.json({
      status: 'success',
      message: 'Mật khẩu đã được đặt lại thành công'
    });
  } catch (error) {
    next(error);
  }
});

// Route test gửi email (chỉ sử dụng trong môi trường phát triển)
router.post('/test-email', csrfProtection, validateRequest(z.object({
  body: z.object({
    email: z.string().email('Email không hợp lệ')
  })
})), async (req, res, next) => {
  try {
    // Chỉ cho phép trong môi trường phát triển
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        status: 'error',
        message: 'Route này chỉ có sẵn trong môi trường phát triển'
      });
    }

    const { email } = req.body;
    
    // Gửi email test
    const result = await sendTestEmail(email);
    
    if (result.success) {
      res.json({
        status: 'success',
        message: 'Email test đã được gửi thành công',
        data: { messageId: result.messageId }
      });
    } else {
      throw new Error('Không thể gửi email test');
    }
  } catch (error) {
    next(error);
  }
});

// Lấy thông tin user hiện tại
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      return next(new AppError('Không tìm thấy người dùng', 404));
    }

    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          preferredLanguage: user.preferredLanguage,
          themePreference: user.themePreference
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Device authentication
router.post('/device', async (req, res, next) => {
  try {
    const { wemosSerial, apiKey, firmwareVersion } = req.body;
    
    console.log('Yêu cầu xác thực thiết bị:', { wemosSerial, apiKey, firmwareVersion });

    if (!wemosSerial || !apiKey) {
      return next(new AppError('Thiếu thông tin bắt buộc', 400));
    }

    // Tìm thiết bị theo serial
    const device = await db.garden.findUnique({
      where: {
        wemosSerial,
      }
    });

    if (!device || device.apiKey !== apiKey) {
      console.log('Xác thực thất bại:', { wemosSerial, found: !!device });
      return next(new AppError('Thông tin xác thực không hợp lệ', 401));
    }

    // Tạo JWT token cho thiết bị
    const token = jwt.sign(
      { id: device.id, type: 'device' },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    // Cập nhật thời gian kết nối cuối cùng và phiên bản firmware nếu có
    await db.garden.update({
      where: { id: device.id },
      data: { 
        lastConnected: new Date(),
        ...(firmwareVersion ? { firmwareVersion } : {})
      }
    });

    // Ghi log xác thực thiết bị
    await db.systemLog.create({
      data: {
        gardenId: device.id,
        eventType: 'AUTH',
        description: `Thiết bị ${wemosSerial} đã xác thực thành công${firmwareVersion ? ` với firmware v${firmwareVersion}` : ''}`,
        level: 'INFO'
      }
    });

    console.log('Xác thực thành công:', { wemosSerial, deviceId: device.id });

    res.json({
      status: 'success',
      data: {
        token,
        device: {
          id: device.id,
          name: device.name
        }
      }
    });
  } catch (error) {
    console.error('Lỗi xác thực thiết bị:', error);
    next(error);
  }
});

// Endpoint đăng xuất
router.post('/logout', protect, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      // Thêm token vào blacklist trong Redis
      // Đặt thời gian hết hạn bằng với thời gian hết hạn của token
      const decoded = jwt.decode(token) as { exp: number };
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      
      if (expiresIn > 0) {
        await redis.set(`bl_${token}`, '1', 'EX', expiresIn);
      }
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    console.error('Lỗi khi đăng xuất:', error);
    res.status(500).json({
      status: 'error',
      message: 'Đã xảy ra lỗi khi đăng xuất'
    });
  }
});

export default router; 