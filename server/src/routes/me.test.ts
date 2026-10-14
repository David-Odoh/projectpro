import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { prisma } from '../db.js';
import { env } from '../env.js';

const carol = { name: 'Carol', email: 'carol@example.com', password: 'correct-horse-battery' };

async function signUp(): Promise<string> {
  const res = await request(app)
    .post('/api/auth/sign-up/email')
    .set('Origin', env.CLIENT_ORIGIN)
    .send(carol);
  const cookie = (res.get('Set-Cookie') ?? []).find((c) => c.includes('session_token='));
  if (!cookie) throw new Error('No session cookie in response');
  return cookie;
}

describe('GET /api/me', () => {
  it('returns 401 in the standard error format without a session', async () => {
    const res = await request(app).get('/api/me');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { message: 'Not signed in' } });
  });

  it('returns the signed-in user with only id, name and email', async () => {
    const cookie = await signUp();
    const user = await prisma.user.findUniqueOrThrow({ where: { email: carol.email } });

    const res = await request(app).get('/api/me').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: { id: user.id, name: 'Carol', email: 'carol@example.com' } });
  });

  it('returns 401 after sign-out', async () => {
    const cookie = await signUp();
    await request(app)
      .post('/api/auth/sign-out')
      .set('Origin', env.CLIENT_ORIGIN)
      .set('Cookie', cookie)
      .expect(200);

    const res = await request(app).get('/api/me').set('Cookie', cookie);

    expect(res.status).toBe(401);
  });

  it('returns 401 after the session row is deleted', async () => {
    const cookie = await signUp();
    await prisma.session.deleteMany();

    const res = await request(app).get('/api/me').set('Cookie', cookie);

    expect(res.status).toBe(401);
  });
});
