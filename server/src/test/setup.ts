import { afterAll, beforeEach } from 'vitest';
import { prisma } from '../db.js';

// Every test starts from empty tables. The migrations table is kept so the schema stays applied.
beforeEach(async () => {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (tables.length === 0) return;

  const list = tables.map(({ tablename }) => `"public"."${tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  await prisma.$disconnect();
});
