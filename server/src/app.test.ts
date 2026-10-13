import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './app.js';

describe('GET /api/health', () => {
  it('responds with ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('error format', () => {
  it('returns a JSON 404 for an unknown route', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.type).toBe('application/json');
    expect(res.body).toEqual({ error: { message: 'Not found' } });
  });

  it('returns a JSON 404 for an unknown method on a known route', async () => {
    const res = await request(app).post('/api/health');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: 'Not found' } });
  });

  it('returns a JSON 400 for a malformed JSON body', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"name":');

    expect(res.status).toBe(400);
    expect(res.type).toBe('application/json');
    expect(Object.keys(res.body as object)).toEqual(['error']);
    expect(res.body).toHaveProperty('error.message');
  });
});
