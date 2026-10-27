import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { prisma } from '../db.js';
import { env } from '../env.js';
import { PROJECT_NAME_MAX } from './schema.js';

const alice = { name: 'Alice', email: 'alice@example.com', password: 'correct-horse-battery' };
const dave = { name: 'Dave', email: 'dave@example.com', password: 'correct-horse-battery' };

async function signUp(user: typeof alice): Promise<string> {
  const res = await request(app)
    .post('/api/auth/sign-up/email')
    .set('Origin', env.CLIENT_ORIGIN)
    .send(user);
  const cookie = (res.get('Set-Cookie') ?? []).find((c) => c.includes('session_token='));
  if (!cookie) throw new Error('No session cookie in response');
  return cookie;
}

type ProjectBody = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  createdBy: { id: string; name: string };
};

function createProject(cookie: string, body: object) {
  return request(app).post('/api/projects').set('Cookie', cookie).send(body);
}

function listProjects(cookie: string) {
  return request(app).get('/api/projects').set('Cookie', cookie);
}

describe('/api/projects without a session', () => {
  it('returns 401 for GET', async () => {
    const res = await request(app).get('/api/projects');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { message: 'Not signed in' } });
  });

  it('returns 401 for POST, even with an invalid body, and creates nothing', async () => {
    const res = await request(app).post('/api/projects').send({ name: '' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { message: 'Not signed in' } });
    expect(await prisma.project.count()).toBe(0);
  });

  it('returns 401 once the session row is deleted', async () => {
    const cookie = await signUp(alice);
    await createProject(cookie, { name: 'Before' }).expect(201);
    await prisma.session.deleteMany();

    const res = await listProjects(cookie);

    expect(res.status).toBe(401);
  });
});

describe('POST /api/projects', () => {
  it('returns 201 with the project and records the signed-in user as creator', async () => {
    const cookie = await signUp(alice);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: alice.email } });

    const res = await createProject(cookie, { name: '  Website  ', description: 'Redesign' });

    expect(res.status).toBe(201);
    const { project } = res.body as { project: ProjectBody };
    expect(Object.keys(project).sort()).toEqual([
      'createdAt',
      'createdBy',
      'description',
      'id',
      'name',
    ]);
    expect(project).toMatchObject({
      name: 'Website',
      description: 'Redesign',
      createdBy: { id: user.id, name: 'Alice' },
    });
    expect(project.createdBy).not.toHaveProperty('email');

    const saved = await prisma.project.findUniqueOrThrow({ where: { id: project.id } });
    expect(saved).toMatchObject({ name: 'Website', description: 'Redesign', createdById: user.id });
  });

  it('ignores a creator id sent in the body', async () => {
    const cookie = await signUp(alice);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: alice.email } });

    const res = await createProject(cookie, { name: 'Website', createdById: 'someone-else' });

    expect(res.status).toBe(201);
    expect((res.body as { project: ProjectBody }).project.createdBy.id).toBe(user.id);
  });

  it('allows the description to be left out', async () => {
    const cookie = await signUp(alice);

    const res = await createProject(cookie, { name: 'Website' });

    expect(res.status).toBe(201);
    expect((res.body as { project: ProjectBody }).project.description).toBeNull();
  });

  it.each([
    ['missing', {}, 'Name is required'],
    ['empty', { name: '' }, 'Name is required'],
    ['only spaces', { name: '   ' }, 'Name is required'],
    [
      'over-long',
      { name: 'a'.repeat(PROJECT_NAME_MAX + 1) },
      `Name must be at most ${PROJECT_NAME_MAX} characters`,
    ],
  ])('returns 400 for a %s name and creates nothing', async (_label, body, message) => {
    const cookie = await signUp(alice);

    const res = await createProject(cookie, body);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: { message: 'Invalid request body', fields: { name: message } },
    });
    expect(await prisma.project.count()).toBe(0);
  });

  it('accepts a name of exactly the maximum length', async () => {
    const cookie = await signUp(alice);

    const res = await createProject(cookie, { name: 'a'.repeat(PROJECT_NAME_MAX) });

    expect(res.status).toBe(201);
  });
});

describe('GET /api/projects', () => {
  it('returns an empty list when there are no projects', async () => {
    const cookie = await signUp(alice);

    const res = await listProjects(cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ projects: [] });
  });

  it('lists projects newest first', async () => {
    const cookie = await signUp(alice);
    const names = ['First', 'Second', 'Third'];
    for (const name of names) {
      await createProject(cookie, { name }).expect(201);
    }
    // Spread the timestamps out so the order doesn't depend on the clock's resolution.
    for (const [i, name] of names.entries()) {
      await prisma.project.updateMany({
        where: { name },
        data: { createdAt: new Date(Date.UTC(2026, 0, i + 1)) },
      });
    }

    const res = await listProjects(cookie);

    expect(res.status).toBe(200);
    const { projects } = res.body as { projects: ProjectBody[] };
    expect(projects.map((p) => p.name)).toEqual(['Third', 'Second', 'First']);
  });

  it("shows a second user the first user's projects, with the creator's name but not email", async () => {
    const aliceCookie = await signUp(alice);
    const daveCookie = await signUp(dave);
    const aliceUser = await prisma.user.findUniqueOrThrow({ where: { email: alice.email } });
    await createProject(aliceCookie, { name: 'Website' }).expect(201);

    const res = await listProjects(daveCookie);

    expect(res.status).toBe(200);
    const { projects } = res.body as { projects: ProjectBody[] };
    expect(projects).toHaveLength(1);
    expect(projects[0]).toMatchObject({
      name: 'Website',
      createdBy: { id: aliceUser.id, name: 'Alice' },
    });
    expect(projects[0]?.createdBy).not.toHaveProperty('email');
  });
});
