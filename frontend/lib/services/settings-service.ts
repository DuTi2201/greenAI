import { api } from '../api';

export interface ProfileData {
  email: string;
  fullName: string;
  preferredLanguage?: string;
  themePreference?: string;
}

export interface UpdateProfileData {
  fullName?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface UpdatePreferencesData {
  preferredLanguage?: 'en' | 'vi';
  themePreference?: 'light' | 'dark';
}

export const settingsService = {
  // Lấy thông tin hồ sơ người dùng
  getProfile: async (): Promise<ProfileData> => {
    const response = await api.get('/settings/profile');
    return response.data.data.profile;
  },

  // Cập nhật thông tin hồ sơ người dùng
  updateProfile: async (data: UpdateProfileData): Promise<ProfileData> => {
    const response = await api.patch('/settings/profile', data);
    return response.data.data.profile;
  },

  // Cập nhật tùy chọn người dùng
  updatePreferences: async (data: UpdatePreferencesData): Promise<any> => {
    const response = await api.patch('/settings/preferences', data);
    return response.data.data.preferences;
  },

  // Lấy danh sách thông báo
  getNotifications: async (): Promise<any[]> => {
    const response = await api.get('/settings/notifications');
    return response.data.data.notifications;
  },

  // Đánh dấu thông báo đã đọc
  markNotificationAsRead: async (notificationId: string): Promise<any> => {
    const response = await api.patch(`/settings/notifications/${notificationId}`);
    return response.data.data.notification;
  },

  // Xóa thông báo
  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete(`/settings/notifications/${notificationId}`);
  }
}; 