import axios from 'axios';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { setAuthTokenFixed, fetchCSRFTokenFixed } from './auth-fix';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Quan trọng để gửi và nhận cookie
});

// Định nghĩa kiểu dữ liệu cho hàng đợi
interface QueueItem {
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}

// Biến để theo dõi nếu đang làm mới token
let isRefreshing = false;
// Mảng các request đang chờ token mới
let failedQueue: QueueItem[] = [];

// Xử lý các request đang chờ
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    // Chỉ thực hiện trên client-side
    if (typeof window !== 'undefined') {
      // Lấy token từ cookie
      const token = Cookies.get('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Không cần cảnh báo nếu đang gọi API không yêu cầu xác thực
        if (!config.url?.includes('/auth/login') && 
            !config.url?.includes('/auth/register') && 
            !config.url?.includes('/auth/csrf-token')) {
          // Chỉ hiển thị cảnh báo khi không ở trang đăng nhập
          if (typeof window !== 'undefined' && 
              !window.location.pathname.startsWith('/login')) {
            console.warn('No token found in cookies');
          }
        }
      }
      
      // Lấy CSRF token từ cookie và thêm vào header
      const csrfToken = Cookies.get('XSRF-TOKEN');
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Nếu không có response, trả về lỗi ngay lập tức
    if (!error.response) {
      return Promise.reject(error);
    }
    
    const originalRequest = error.config;
    
    // Xử lý lỗi 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Nếu lỗi là token hết hạn hoặc không hợp lệ
      if (isRefreshing) {
        // Nếu đang làm mới token, thêm request vào hàng đợi
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      // Thử làm mới token
      try {
        const token = Cookies.get('token');
        if (!token) {
          throw new Error('No token available for refresh');
        }
        
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/refresh-token`,
          {},
          { 
            headers: { Authorization: `Bearer ${token}` },
            // Thêm tham số để tránh cache
            params: { _t: new Date().getTime() }
          }
        );
        
        if (response.data.token) {
          // Lưu token mới sử dụng hàm đã sửa
          setAuthTokenFixed(response.data.token);
          // Cập nhật header cho request ban đầu
          originalRequest.headers['Authorization'] = `Bearer ${response.data.token}`;
          // Xử lý các request đang chờ
          processQueue(null, response.data.token);
          isRefreshing = false;
          // Thử lại request ban đầu
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Xử lý lỗi refresh token một cách yên lặng
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Xóa token sử dụng hàm đã sửa
        setAuthTokenFixed('');
        
        // Chuyển hướng đến trang đăng nhập chỉ khi cần thiết
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/auth-fix', '/auth-debug'];
          
          if (!publicPaths.some(path => currentPath.startsWith(path))) {
            // Lưu đường dẫn hiện tại để redirect sau khi đăng nhập
            sessionStorage.setItem('redirectAfterLogin', currentPath);
            
            // Chuyển hướng đến trang đăng nhập
            window.location.href = `/login?callbackUrl=${encodeURIComponent(currentPath)}`;
          }
        }
        
        return Promise.reject(refreshError);
      }
    } else if (error.response?.status === 401) {
      // Các lỗi 401 khác (không phải token hết hạn)
      // Chỉ thực hiện trên client-side
      if (typeof window !== 'undefined') {
        // Xử lý lỗi xác thực một cách yên lặng
        
        // Xóa token sử dụng hàm đã sửa
        setAuthTokenFixed('');
        
        // Chỉ chuyển hướng khi không ở trang công khai
        const currentPath = window.location.pathname;
        const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/auth-fix', '/auth-debug'];
        
        if (!publicPaths.some(path => currentPath.startsWith(path))) {
          // Lưu đường dẫn hiện tại để redirect sau khi đăng nhập
          sessionStorage.setItem('redirectAfterLogin', currentPath);
          
          // Chuyển hướng đến trang đăng nhập
          window.location.href = `/login?callbackUrl=${encodeURIComponent(currentPath)}`;
        }
      }
    }
    
    // Xử lý lỗi CSRF token
    if (error.response?.status === 403 && error.response?.data?.message?.includes('csrf')) {
      // Thử lấy lại CSRF token mới sử dụng hàm đã sửa
      try {
        await fetchCSRFTokenFixed();
        // Thử lại request ban đầu
        if (error.config) {
          return api(error.config);
        }
      } catch (csrfError) {
        // Xử lý lỗi CSRF token một cách yên lặng
      }
    }
    
    return Promise.reject(error);
  }
);

// Hàm để lấy CSRF token từ server (giữ lại để tương thích ngược)
export const fetchCSRFToken = async () => {
  return fetchCSRFTokenFixed();
};

// Hàm để thiết lập token xác thực (giữ lại để tương thích ngược)
export const setAuthToken = (token: string) => {
  return setAuthTokenFixed(token);
};

// Hàm tiện ích để xóa token (giữ lại để tương thích ngược)
export const removeAuthToken = () => {
  setAuthTokenFixed('');
};

// Hàm tiện ích để kiểm tra xem người dùng đã đăng nhập chưa
export const isAuthenticated = () => {
  return !!Cookies.get('token');
};

export { api }; 