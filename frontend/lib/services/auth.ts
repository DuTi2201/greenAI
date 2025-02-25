import { api } from '../api';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  preferredLanguage?: string;
  themePreference?: string;
}

export interface UserSettings {
  preferredLanguage: string;
  themePreference: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  preferredLanguage: string;
  themePreference: string;
  role: string;
  isActive: boolean;
}

export interface AuthResponse {
  status: string;
  data: {
    user: User;
    token: string;
  };
}

export interface RefreshTokenResponse {
  status: string;
  token: string;
  user: User;
}

class AuthService {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = Cookies.get('token') || null;
      if (this.token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      }
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return Cookies.get('token') || null;
    }
    return this.token;
  }

  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      Cookies.set('token', token, { expires: 7, path: '/' });
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }

  clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      Cookies.remove('token', { path: '/' });
      delete api.defaults.headers.common['Authorization'];
    }
  }

  async login(email: string, password: string) {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    this.setToken(response.data.data.token);
    return response.data;
  }

  async register(data: RegisterData) {
    const response = await api.post<AuthResponse>('/auth/register', data);
    this.setToken(response.data.data.token);
    return response.data;
  }

  async updateSettings(settings: UserSettings): Promise<User> {
    try {
      const response = await api.patch(
        `/auth/settings`,
        settings,
        {
          headers: { Authorization: `Bearer ${this.getToken()}` }
        }
      );
      return response.data.data.user;
    } catch (error) {
      console.error('Update settings error:', error);
      throw error;
    }
  }

  async validateToken() {
    try {
      const response = await api.get<{
        status: string;
        data: {
          valid: boolean;
          user: User;
        };
      }>('/auth/validate', {
        params: { _t: new Date().getTime() }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async refreshToken() {
    try {
      const response = await api.post<RefreshTokenResponse>('/auth/refresh-token', {}, {
        params: { _t: new Date().getTime() }
      });
      this.setToken(response.data.token);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async me() {
    try {
      const response = await api.get<{
        status: string;
        data: {
          user: User;
        };
      }>('/auth/me', {
        params: { _t: new Date().getTime() }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async forgotPassword(email: string) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token: string, newPassword: string) {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  async logout(): Promise<void> {
    try {
      // Gọi API đăng xuất
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Lỗi khi gọi API đăng xuất:', error);
    } finally {
      // Xóa token khỏi client
      this.clearToken();
    }
  }
}

export const authService = new AuthService(); 