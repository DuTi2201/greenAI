export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  VERIFY: '/auth/verify',
  
  // Sensor endpoints
  SENSOR_LATEST: '/sensors/latest',
  SENSOR_HISTORY: '/sensors',
  
  // Device endpoints
  DEVICES: '/devices',
  DEVICE_CONTROL: (id: string) => `/devices/${id}/control`,
  
  // Advisor endpoints
  ADVISOR_ANALYZE: '/advisor/analyze',
  ADVISOR_HISTORY: '/advisor/history',
  
  // Alert endpoints
  ALERTS: '/alerts',
  
  // User endpoints
  USER_PROFILE: '/users/profile',
  USER_SETTINGS: '/users/settings',

  // Report endpoints
  REPORTS_WEEKLY: '/reports/weekly',
  REPORTS_EXPORT: '/reports/export',
}; 