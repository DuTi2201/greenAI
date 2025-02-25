import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

beforeAll(async () => {
  // Kết nối database test
  await prisma.$connect();
});

afterAll(async () => {
  // Cleanup sau khi test xong
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Reset database trước mỗi test
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
        );
      } catch (error) {
        console.log({ error });
      }
    }
  }
}); 