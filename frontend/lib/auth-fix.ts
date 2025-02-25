import Cookies from 'js-cookie';
import axios from 'axios';
import { api } from './api';

// Hàm để thiết lập token xác thực đúng cách
export const setAuthTokenFixed = (token: string) => {
  if (token) {
    // Thiết lập cookie với các tùy chọn đúng
    Cookies.set('token', token, { 
      expires: 7, // 7 ngày
      path: '/', // Áp dụng cho toàn bộ trang web
      sameSite: 'strict', // Tăng cường bảo mật
      secure: window.location.protocol === 'https:' // Chỉ gửi qua HTTPS nếu đang sử dụng HTTPS
    });
    
    // Thiết lập header Authorization cho tất cả các request
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Lưu token vào localStorage để dự phòng (tùy chọn)
    localStorage.setItem('token_backup', token);
    
    console.log('Token đã được thiết lập thành công');
    return true;
  } else {
    // Xóa token
    Cookies.remove('token', { path: '/' });
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token_backup');
    
    console.log('Token đã được xóa');
    return false;
  }
};

// Hàm để lấy CSRF token đúng cách
export const fetchCSRFTokenFixed = async () => {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const response = await axios.get(`${API_URL}/auth/csrf-token`, { 
      withCredentials: true,
      params: { _t: new Date().getTime() } // Tránh cache
    });
    
    if (response.data && response.data.csrfToken) {
      // Lưu CSRF token vào cookie
      Cookies.set('XSRF-TOKEN', response.data.csrfToken, { 
        path: '/',
        sameSite: 'strict',
        secure: window.location.protocol === 'https:'
      });
      
      // Thiết lập header X-CSRF-Token cho tất cả các request
      api.defaults.headers.common['X-CSRF-Token'] = response.data.csrfToken;
      
      console.log('CSRF token đã được thiết lập thành công');
      return response.data.csrfToken;
    }
    
    return null;
  } catch (error) {
    console.warn('Lỗi khi lấy CSRF token:', error);
    return null;
  }
};

// Hàm để kiểm tra và khôi phục token nếu cần
export const checkAndRestoreToken = () => {
  // Kiểm tra xem có token trong cookie không
  const tokenInCookie = Cookies.get('token');
  
  if (!tokenInCookie) {
    // Nếu không có token trong cookie, kiểm tra trong localStorage
    const tokenBackup = localStorage.getItem('token_backup');
    
    if (tokenBackup) {
      // Khôi phục token từ localStorage
      setAuthTokenFixed(tokenBackup);
      console.log('Đã khôi phục token từ localStorage');
      return true;
    }
  } else {
    // Đảm bảo token được thiết lập trong header
    api.defaults.headers.common['Authorization'] = `Bearer ${tokenInCookie}`;
    console.log('Đã thiết lập lại token từ cookie');
    return true;
  }
  
  return false;
};

// Hàm để sửa vấn đề đăng nhập
export const fixLoginIssue = async () => {
  console.log('Bắt đầu sửa vấn đề đăng nhập...');
  
  // 1. Kiểm tra và khôi phục token
  const tokenRestored = checkAndRestoreToken();
  
  // 2. Lấy CSRF token mới
  await fetchCSRFTokenFixed();
  
  // 3. Kiểm tra xem token có hợp lệ không
  if (tokenRestored) {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await axios.get(`${API_URL}/auth/validate`, {
        headers: { Authorization: `Bearer ${Cookies.get('token')}` },
        params: { _t: new Date().getTime() }
      });
      
      console.log('Token hợp lệ, không cần làm mới');
      return true;
    } catch (error: any) {
      // Nếu token không hợp lệ, thử làm mới
      if (error.response?.status === 401) {
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {}, {
            headers: { Authorization: `Bearer ${Cookies.get('token')}` },
            params: { _t: new Date().getTime() }
          });
          
          if (response.data.token) {
            setAuthTokenFixed(response.data.token);
            console.log('Đã làm mới token thành công');
            return true;
          }
        } catch (refreshError) {
          console.warn('Không thể làm mới token:', refreshError);
        }
      }
    }
  }
  
  console.log('Không thể sửa vấn đề đăng nhập, cần đăng nhập lại');
  return false;
}; 