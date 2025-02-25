import { prisma } from '../prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export async function createTestUser() {
  const hashedPassword = await bcrypt.hash('test-password', 10);
  return prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      passwordHash: hashedPassword,
      fullName: 'Test User',
    },
  });
}

export function createTestToken(userId: string) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}

export async function cleanupDatabase() {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.log({ error });
  }
} 