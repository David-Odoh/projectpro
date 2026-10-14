import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app as authApp } from '../app.js';
import { prisma } from '../db.js';
import { env } from '../env.js';
import { errorHandler } from './errorHandler.js';
import { requireAuth } from './requireAuth.js';

// No real route uses requireAuth until the projects API, so test it on a small app of its own.
const protectedApp = express();
protectedApp.get('/protected', requireAuth, (req, res) => {
  res.json({ userId: req.user?.id, email: req.user?.email });
});
protectedApp.use(errorHandler);

async function signedInCookie(): Promise<string> {
  const res = await request(authApp)
    .post('/api/auth/sign-up/email')
    .set('Origin', env.CLIENT_ORIGIN)
    .send({ name: 'Bob', email: 'bob@example.com', password: 'correct-horse-battery' });
  const cookie = (res.get('Set-Cookie') ?? []).find((c) => c.includes('session_token='));
  if (!cookie) throw new Error('No session cookie in response');
  return cookie;
}

describe('requireAuth', () => {
  it('returns 401 in the standard error format without a session', async () => {
    const res = await request(protectedApp).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { message: 'Not signed in' } });
  });

  it('sets req.user for a signed-in request', async () => {
    const cookie = await signedInCookie();

    const res = await request(protectedApp).get('/protected').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: 'bob@example.com' });
    expect(res.body).toHaveProperty('userId');
  });

  it('returns 401 once the session row is deleted', async () => {
    const cookie = await signedInCookie();
    await prisma.session.deleteMany();

    const res = await request(protectedApp).get('/protected').set('Cookie', cookie);

    expect(res.status).toBe(401);
  });
});
