import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// Same rule as src/env.ts: variables already set in the environment win over .env,
// which lets the test setup point the CLI at projectpro_test.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
