"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { setAuthTokenFixed, checkAndRestoreToken, fixLoginIssue } from '@/lib/auth-fix';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function TokenChecker() {
  const [checking, setChecking] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Các đường dẫn không cần xác thực
  const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
  
  useEffect(() => {
    // Bỏ qua kiểm tra nếu đang ở trang đăng nhập hoặc đăng ký
    if (pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
      setChecking(false);
      return;
    }

    // Kiểm tra và khôi phục token nếu cần
    checkAndRestoreToken();

    const token = Cookies.get('token');
    if (!token) {
      // Nếu không có token, chuyển hướng đến trang đăng nhập
      setChecking(false);
      
      // Lưu đường dẫn hiện tại để redirect sau khi đăng nhập
      sessionStorage.setItem('redirectAfterLogin', pathname || '/dashboard');
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname || '/dashboard')}`);
      return;
    }

    const checkToken = async () => {
      try {
        // Thử sửa vấn đề đăng nhập
        const fixed = await fixLoginIssue();
        
        if (fixed) {
          setChecking(false);
          return;
        }
        
        // Nếu không thể sửa, chuyển hướng đến trang đăng nhập
        Cookies.remove('token', { path: '/' });
        sessionStorage.setItem('redirectAfterLogin', pathname || '/dashboard');
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname || '/dashboard')}`);
      } catch (error: any) {
        // Xử lý lỗi 404 (endpoint không tồn tại) - coi như token hợp lệ
        if (error.response?.status === 404) {
          console.warn('Validate endpoint not found, assuming token is valid');
          setChecking(false);
          return;
        }
        
        // Nếu token không hợp lệ hoặc hết hạn
        if (error.response?.status === 401) {
          try {
            // Thử làm mới token
            const refreshResponse = await axios.post(`${API_URL}/auth/refresh-token`, {}, {
              headers: { Authorization: `Bearer ${token}` },
              // Thêm tham số để tránh cache
              params: { _t: new Date().getTime() }
            });
            
            if (refreshResponse.data.token) {
              // Lưu token mới
              setAuthTokenFixed(refreshResponse.data.token);
              setChecking(false);
              return;
            }
          } catch (refreshError: any) {
            // Nếu endpoint refresh-token cũng không tồn tại (404), coi như token hợp lệ
            if (refreshError.response?.status === 404) {
              console.warn('Refresh token endpoint not found, assuming token is valid');
              setChecking(false);
              return;
            }
            
            // Xử lý lỗi refresh token một cách yên lặng - không hiển thị lỗi
            // Chỉ hiển thị cảnh báo
            if (!window.location.pathname.startsWith('/login')) {
              console.warn('Failed to refresh token, redirecting to login');
            }
            
            // Nếu không thể làm mới, xóa token và chuyển hướng đến trang đăng nhập
            Cookies.remove('token', { path: '/' });
            
            // Lưu đường dẫn hiện tại để redirect sau khi đăng nhập
            sessionStorage.setItem('redirectAfterLogin', pathname || '/dashboard');
            router.push(`/login?callbackUrl=${encodeURIComponent(pathname || '/dashboard')}`);
          }
        } else {
          // Các lỗi khác, xóa token và chuyển hướng đến trang đăng nhập
          Cookies.remove('token', { path: '/' });
          
          // Lưu đường dẫn hiện tại để redirect sau khi đăng nhập
          sessionStorage.setItem('redirectAfterLogin', pathname || '/dashboard');
          router.push(`/login?callbackUrl=${encodeURIComponent(pathname || '/dashboard')}`);
        }
      } finally {
        setChecking(false);
      }
    };
    
    checkToken();
  }, [pathname, router]);
  
  // Không hiển thị gì nếu đang ở trang công khai
  if (publicPaths.some(path => pathname?.startsWith(path))) {
    return null;
  }
  
  // Hiển thị loading nếu đang kiểm tra token
  if (checking) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Đang kiểm tra xác thực...</p>
        </div>
      </div>
    );
  }
  
  // Không hiển thị gì nếu token hợp lệ
  return null;
} 