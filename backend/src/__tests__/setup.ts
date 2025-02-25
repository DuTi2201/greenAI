import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn()
}));

export const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});

export const mockPrisma = PrismaClient as jest.Mock;
mockPrisma.mockReturnValue(prismaMock); 