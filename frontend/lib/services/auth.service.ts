import { api } from '../api';
import { API_ENDPOINTS } from '../api-config';
import { useAuth } from '../hooks/use-auth';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post(API_ENDPOINTS.LOGIN, credentials);
    if (response.data.token && response.data.user) {
      useAuth.getState().login(response.data.token, response.data.user);
    }
    return response.data;
  },

  logout: () => {
    useAuth.getState().logout();
    window.location.href = '/login';
  },

  isAuthenticated: (): boolean => {
    return useAuth.getState().isAuthenticated;
  },
}; 