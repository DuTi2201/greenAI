"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { authService } from '@/lib/services/auth';
import { setAuthTokenFixed, fetchCSRFTokenFixed, checkAndRestoreToken, fixLoginIssue } from '@/lib/auth-fix';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  preferredLanguage: string;
  themePreference: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Kiểm tra token và lấy thông tin người dùng khi component mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        // Kiểm tra và khôi phục token nếu cần
        checkAndRestoreToken();
        
        const token = Cookies.get('token');
        if (!token) {
          setLoading(false);
          return;
        }

        try {
          // Thử sửa vấn đề đăng nhập trước
          const fixed = await fixLoginIssue();
          if (fixed) {
            // Nếu đã sửa thành công, lấy thông tin người dùng
            try {
              const meResponse = await authService.me();
              if (meResponse.data?.user) {
                setUser(meResponse.data.user);
              }
              setLoading(false);
              return;
            } catch (meError) {
              console.warn('Không thể lấy thông tin người dùng sau khi sửa:', meError);
            }
          }
          
          // Kiểm tra token có hợp lệ không
          const response = await authService.validateToken();
          if (response.data?.user) {
            setUser(response.data.user);
          }
        } catch (validationError: any) {
          // Xử lý lỗi 404 (endpoint không tồn tại) - coi như token hợp lệ
          if (validationError.response?.status === 404) {
            // Thử lấy thông tin người dùng từ endpoint /me
            try {
              const meResponse = await authService.me();
              if (meResponse.data?.user) {
                setUser(meResponse.data.user);
              }
            } catch (meError) {
              // Nếu không lấy được thông tin người dùng, xóa token
              setAuthTokenFixed('');
              
              // Chỉ chuyển hướng nếu không ở trang công khai
              const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/auth-fix', '/auth-debug'];
              if (pathname && !publicPaths.some(path => pathname.startsWith(path))) {
                router.push('/login');
              }
            }
            setLoading(false);
            return;
          }
          
          // Nếu token không hợp lệ hoặc hết hạn
          if (validationError.response?.status === 401) {
            try {
              // Thử làm mới token
              const refreshResponse = await authService.refreshToken();
              if (refreshResponse.token) {
                // Lưu token mới
                setAuthTokenFixed(refreshResponse.token);
                // Lấy thông tin người dùng
                if (refreshResponse.user) {
                  setUser(refreshResponse.user);
                }
                setLoading(false);
                return;
              }
            } catch (refreshError: any) {
              // Xóa token không hợp lệ
              setAuthTokenFixed('');
              setUser(null);
              
              // Chỉ chuyển hướng nếu không ở trang công khai
              const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/auth-fix', '/auth-debug'];
              if (pathname && !publicPaths.some(path => pathname.startsWith(path))) {
                // Lưu đường dẫn hiện tại để redirect sau khi đăng nhập
                sessionStorage.setItem('redirectAfterLogin', pathname);
                router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
              }
            }
          } else {
            // Các lỗi khác, xóa token
            setAuthTokenFixed('');
            setUser(null);
          }
        }
      } catch (error) {
        setAuthTokenFixed('');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [router, pathname]);

  // Đăng nhập
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      // Lấy CSRF token trước khi đăng nhập
      await fetchCSRFTokenFixed();
      
      const response = await authService.login(email, password);
      
      // Lưu token vào cookie
      if (response.data?.token) {
        setAuthTokenFixed(response.data.token);
      }
      
      // Lưu thông tin người dùng
      if (response.data?.user) {
        setUser(response.data.user);
      }
      
      // Chuyển hướng sau khi đăng nhập thành công
      const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
      sessionStorage.removeItem('redirectAfterLogin');
      router.push(redirectPath);
      
      return response;
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Đăng nhập thất bại');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Đăng ký
  const register = async (userData: any) => {
    setLoading(true);
    setError(null);
    try {
      // Lấy CSRF token trước khi đăng ký
      await fetchCSRFTokenFixed();
      
      const response = await authService.register(userData);
      
      // Lưu token vào cookie
      if (response.data?.token) {
        setAuthTokenFixed(response.data.token);
      }
      
      // Lưu thông tin người dùng
      if (response.data?.user) {
        setUser(response.data.user);
      }
      
      // Chuyển hướng sau khi đăng ký thành công
      router.push('/dashboard');
      
      return response;
    } catch (error: any) {
      console.error('Register error:', error);
      setError(error.response?.data?.message || 'Đăng ký thất bại');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Đăng xuất
  const logout = async () => {
    try {
      // Gọi phương thức logout của authService
      await authService.logout();
      
      // Xóa token
      setAuthTokenFixed('');
      
      // Xóa thông tin người dùng
      setUser(null);
      
      // Chuyển hướng đến trang đăng nhập
      router.push('/login');
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      
      // Xóa token và thông tin người dùng ngay cả khi có lỗi
      setAuthTokenFixed('');
      setUser(null);
      router.push('/login');
    }
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };
} 