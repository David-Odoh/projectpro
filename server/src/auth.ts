import { prismaAdapter } from '@better-auth/prisma-adapter';
import { betterAuth } from 'better-auth';
import { prisma } from './db.js';
import { env } from './env.js';

const DAY_IN_SECONDS = 60 * 60 * 24;

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  // The browser app runs on its own origin in development (Vite), so trust it for auth requests.
  trustedOrigins: [env.CLIENT_ORIGIN],
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 7 * DAY_IN_SECONDS,
    // Extend the session at most once a day while it is in use.
    updateAge: DAY_IN_SECONDS,
    // Off so every request is checked against the session table and sign-out takes effect at once.
    cookieCache: { enabled: false },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
