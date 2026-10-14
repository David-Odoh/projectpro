import { describe, expect, it } from 'vitest';
import { prisma } from './db.js';

describe('database client', () => {
  it('queries the test database', async () => {
    const [row] = await prisma.$queryRaw<{ db: string; one: number }[]>`
      SELECT current_database() AS db, 1 AS one
    `;

    expect(row).toEqual({ db: 'projectpro_test', one: 1 });
  });
});
