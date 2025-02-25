import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { User } from '../types/user';

interface AuthResponse {
  user: User;
  token: string;
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      fullName: string;
      preferredLanguage?: string;
      themePreference?: string;
    }) => api.post<AuthResponse>('/auth/register', data).then((res) => res.data),
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post<AuthResponse>('/auth/login', data).then((res) => res.data),
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => api.get<{ user: User }>('/auth/me').then((res) => res.data.user),
  });
} 