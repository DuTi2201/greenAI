export interface User {
  id: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  role: 'user' | 'admin';
  preferredLanguage: string;
  themePreference: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
} 