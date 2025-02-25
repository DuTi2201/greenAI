import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { db } from '../../singleton';

// Tạo mock cho PrismaClient
export const prismaMock = mockDeep<PrismaClient>();

// Mock singleton db
jest.mock('../../singleton', () => ({
  db: mockDeep<PrismaClient>()
}));

beforeAll(async () => {
  // Đảm bảo kết nối database
  await db.$connect();
});

afterAll(async () => {
  // Đóng kết nối database
  await db.$disconnect();
});

// Reset mock trước mỗi test
beforeEach(() => {
  mockReset(prismaMock);
});

// Export type cho mock
export type Context = {
  db: DeepMockProxy<PrismaClient>
};

// Xóa dữ liệu test sau mỗi test suite
afterEach(() => {
  // Reset mock trước mỗi test
  mockReset(prismaMock);
}); 