import { z } from 'zod';

// Better Auth's defaults; the server's auth.ts doesn't override them.
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

// Trimmed first so a pasted address with stray spaces still passes the server's z.email() check.
const email = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .pipe(z.email('Enter a valid email address'));

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email,
  // Passwords are not trimmed: spaces are valid characters and the server counts them.
  password: z
    .string()
    .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
    .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters`),
});

// Only checks that a password was entered; a wrong one gets the server's single
// "invalid email or password" error instead of revealing the length rules.
export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
