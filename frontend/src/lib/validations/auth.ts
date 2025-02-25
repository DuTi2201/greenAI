import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  fullName: z.string().min(1, 'Họ tên không được để trống'),
  preferredLanguage: z.string().default('vi'),
  themePreference: z.string().default('light'),
});

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
}); 