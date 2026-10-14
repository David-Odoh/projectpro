import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './app.js';
import { prisma } from './db.js';
import { env } from './env.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// Better Auth skips its origin check when NODE_ENV is "test", so trustedOrigins can't be tested
// here. Requests still send the client's Origin, as a browser would.
const alice = { name: 'Alice', email: 'alice@example.com', password: 'correct-horse-battery' };

function signUp(body: Record<string, string> = alice) {
  return request(app).post('/api/auth/sign-up/email').set('Origin', env.CLIENT_ORIGIN).send(body);
}

function signIn(email: string, password: string) {
  return request(app)
    .post('/api/auth/sign-in/email')
    .set('Origin', env.CLIENT_ORIGIN)
    .send({ email, password });
}

function sessionCookie(res: request.Response): string {
  const cookies = res.get('Set-Cookie') ?? [];
  const cookie = cookies.find((c) => c.includes('session_token='));
  if (!cookie) throw new Error('No session cookie in response');
  return cookie;
}

describe('GET /api/auth/ok', () => {
  it('responds', async () => {
    const res = await request(app).get('/api/auth/ok');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe('sign-up', () => {
  it('creates a user and a session row, and sets an httpOnly session cookie', async () => {
    const res = await signUp();

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ user: { name: 'Alice', email: 'alice@example.com' } });

    const user = await prisma.user.findUniqueOrThrow({ where: { email: alice.email } });
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(1);

    const cookie = sessionCookie(res);
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it('stores a hashed password, never the plain text', async () => {
    await signUp();

    const account = await prisma.account.findFirstOrThrow({
      where: { user: { email: alice.email } },
    });
    expect(account.password).toBeTruthy();
    expect(account.password).not.toContain(alice.password);
  });

  it('creates a session that lasts 7 days', async () => {
    await signUp();

    const session = await prisma.session.findFirstOrThrow();
    const lifetime = session.expiresAt.getTime() - session.createdAt.getTime();
    expect(lifetime).toBeGreaterThan(7 * DAY_MS - 60_000);
    expect(lifetime).toBeLessThan(7 * DAY_MS + 60_000);
  });

  it('rejects a duplicate email', async () => {
    await signUp();

    const res = await signUp({ ...alice, name: 'Another Alice' });

    expect(res.status).toBe(422);
    expect(await prisma.user.count()).toBe(1);
  });

  it('rejects a password shorter than 8 characters', async () => {
    const res = await signUp({ ...alice, password: 'short12' });

    expect(res.status).toBe(400);
    expect(await prisma.user.count()).toBe(0);
  });
});

describe('sign-in', () => {
  it('sets a session cookie that get-session accepts', async () => {
    await signUp();

    const res = await signIn(alice.email, alice.password);
    expect(res.status).toBe(200);

    const session = await request(app)
      .get('/api/auth/get-session')
      .set('Cookie', sessionCookie(res));
    expect(session.status).toBe(200);
    expect(session.body).toMatchObject({ user: { email: alice.email } });
  });

  it('rejects a wrong password', async () => {
    await signUp();

    const res = await signIn(alice.email, 'wrong-password');

    expect(res.status).toBe(401);
    expect(res.get('Set-Cookie') ?? []).not.toContainEqual(
      expect.stringContaining('session_token=') as string,
    );
  });

  it('rejects an unknown email', async () => {
    const res = await signIn('nobody@example.com', alice.password);

    expect(res.status).toBe(401);
  });
});

describe('sign-out', () => {
  function signOut(cookie?: string) {
    const req = request(app).post('/api/auth/sign-out').set('Origin', env.CLIENT_ORIGIN);
    return cookie ? req.set('Cookie', cookie) : req;
  }

  it('deletes the session row', async () => {
    const cookie = sessionCookie(await signUp());
    expect(await prisma.session.count()).toBe(1);

    const res = await signOut(cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(await prisma.session.count()).toBe(0);

    const session = await request(app).get('/api/auth/get-session').set('Cookie', cookie);
    expect(session.body).toBeNull();
  });

  it('clears the session cookie', async () => {
    const cookie = sessionCookie(await signUp());

    const res = await signOut(cookie);

    expect(sessionCookie(res)).toMatch(/session_token=;.*Max-Age=0/i);
  });

  it('revokes only the current session', async () => {
    const first = sessionCookie(await signUp());
    const second = sessionCookie(await signIn(alice.email, alice.password));
    expect(await prisma.session.count()).toBe(2);

    await signOut(first).expect(200);

    expect(await prisma.session.count()).toBe(1);
    const session = await request(app).get('/api/auth/get-session').set('Cookie', second);
    expect(session.body).toMatchObject({ user: { email: alice.email } });
  });

  it('succeeds without a session, so signing out twice is harmless', async () => {
    const res = await signOut();

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });
});
