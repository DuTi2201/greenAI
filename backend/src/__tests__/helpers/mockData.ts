export const mockDevice = {
  id: 'test-device-id',
  userId: 'test-user-id',
  wemosSerial: 'test-serial',
  name: 'Test Device',
  apiKey: 'test-api-key',
  location: null,
  description: 'Test device description',
  status: 'online',
  lastConnected: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  deviceType: 'ESP8266',
  firmwareVersion: '1.0.0',
  deviceStatus: []
} as const;

export const mockRule = {
  id: 'test-rule-id',
  gardenId: 'test-device-id',
  sensorType: 'temperature',
  conditionOperator: '>',
  thresholdValue: 30,
  actionDevice: 'fan',
  actionStatus: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
} as const;

export const mockSensorData = {
  id: 'test-sensor-data-id',
  gardenId: 'test-device-id',
  temperature: { toString: () => "25" },
  humidity: { toString: () => "60" },
  lightLevel: { toString: () => "800" },
  soilMoisture: { toString: () => "70" },
  recordedAt: new Date()
} as const;

export const mockDeviceStatus = {
  id: 'test-device-status-id',
  gardenId: 'test-device-id',
  fanStatus: false,
  ledStatus: true,
  nutrientPumpStatus: false,
  waterPumpStatus: false,
  updatedAt: new Date()
} as const;

export const mockSchedule = {
  id: 'test-schedule-id',
  gardenId: 'test-device-id',
  deviceType: 'fan',
  actionStatus: true,
  cronExpression: '0 * * * *',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
} as const;

export const mockNotification = {
  id: 'test-notification-id',
  userId: 'test-user-id',
  gardenId: 'test-device-id',
  title: 'Test Notification',
  message: 'This is a test notification',
  type: 'info',
  isRead: false,
  createdAt: new Date(),
  updatedAt: new Date()
} as const;

export const mockAnalysis = {
  id: 'test-analysis-id',
  gardenId: 'test-device-id',
  reportType: 'health',
  result: { status: 'healthy', recommendations: [] },
  status: 'completed',
  reportFormat: 'json',
  analysisPeriodStart: new Date(),
  analysisPeriodEnd: new Date(),
  geminiModelVersion: 'gemini-pro',
  createdAt: new Date()
} as const;

export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  passwordHash: 'test-hash',
  fullName: 'Test User',
  preferredLanguage: 'en',
  themePreference: 'light',
  phoneNumber: null,
  dateOfBirth: null,
  resetToken: null,
  resetTokenExpiry: null,
  role: 'user',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
} as const;

export const createMockPrismaGarden = () => ({
  ...mockDevice,
  automationRules: {
    findMany: jest.fn().mockResolvedValue([mockRule]),
    findUnique: jest.fn().mockResolvedValue(mockRule),
    create: jest.fn().mockImplementation((data: any) => Promise.resolve({
      id: 'new-rule-id',
      gardenId: mockDevice.id,
      ...data.data,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    update: jest.fn().mockImplementation((data: any) => Promise.resolve({
      ...mockRule,
      ...data.data
    })),
    delete: jest.fn().mockResolvedValue(mockRule)
  },
  sensorData: {
    findMany: jest.fn().mockResolvedValue([mockSensorData]),
    create: jest.fn().mockResolvedValue(mockSensorData)
  },
  deviceStatus: {
    findMany: jest.fn().mockResolvedValue([mockDeviceStatus]),
    create: jest.fn().mockResolvedValue(mockDeviceStatus),
    update: jest.fn().mockImplementation((data: any) => Promise.resolve({
      ...mockDeviceStatus,
      ...data.data
    }))
  },
  schedules: {
    findMany: jest.fn().mockResolvedValue([mockSchedule]),
    findUnique: jest.fn().mockResolvedValue(mockSchedule),
    create: jest.fn().mockImplementation((data: any) => Promise.resolve({
      id: 'new-schedule-id',
      gardenId: mockDevice.id,
      ...data.data,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    update: jest.fn().mockImplementation((data: any) => Promise.resolve({
      ...mockSchedule,
      ...data.data
    })),
    delete: jest.fn().mockResolvedValue(mockSchedule)
  }
}); 