import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env.js';
import { PrismaClient } from './generated/prisma/client.js';

// One client for the whole server, so every request shares the same connection pool.
export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
});
