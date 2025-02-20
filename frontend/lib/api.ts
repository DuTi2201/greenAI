import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL } from './api-config';
import { useNotificationStore } from './services/notification.service';
import { useAuth } from './hooks/use-auth';

interface ApiErrorResponse {
  message: string;
  [key: string]: any;
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor để tự động thêm token vào header
api.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor để xử lý lỗi và thông báo
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Xử lý thông báo thành công nếu có
    if (response.data?.message) {
      useNotificationStore.getState().addNotification({
        type: 'success',
        message: response.data.message,
      });
    }
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    // Xử lý các loại lỗi
    let message = 'Đã có lỗi xảy ra';
    let type: 'error' | 'warning' = 'error';

    if (error.response) {
      // Lỗi từ server
      switch (error.response.status) {
        case 401:
          message = 'Phiên đăng nhập đã hết hạn';
          type = 'warning';
          // Xử lý logout nếu token hết hạn
          useAuth.getState().logout();
          break;
        case 403:
          message = 'Bạn không có quyền thực hiện thao tác này';
          break;
        case 404:
          message = 'Không tìm thấy tài nguyên';
          break;
        case 422:
          message = error.response.data?.message || 'Dữ liệu không hợp lệ';
          break;
        case 500:
          message = 'Lỗi hệ thống';
          break;
        default:
          message = error.response.data?.message || message;
      }
    } else if (error.request) {
      // Lỗi không có response
      message = 'Không thể kết nối đến server';
    }

    useNotificationStore.getState().addNotification({
      type,
      message,
    });

    return Promise.reject(error);
  }
); 