import { existsSync } from 'node:fs';
import { z } from 'zod';

// Variables already set in the environment take precedence over .env.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const envSchema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32, 'must be at least 32 characters'),
  BETTER_AUTH_URL: z.url(),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables (see server/.env.example):\n${z.prettifyError(parsed.error)}`,
  );
}

export const env = parsed.data;
