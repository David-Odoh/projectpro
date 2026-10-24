import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createProjectSchema } from '../projects/schema.js';
import { errorHandler, type ErrorBody } from './errorHandler.js';
import { validateBody } from './validate.js';

// The projects routes don't exist yet, so test the middleware on a small app of its own.
const app = express();
app.use(express.json());
app.post('/projects', validateBody(createProjectSchema), (req, res) => {
  res.json({ body: req.body as unknown });
});
app.use(errorHandler);

describe('validateBody', () => {
  it('passes the parsed body on to the handler', async () => {
    const res = await request(app)
      .post('/projects')
      .send({ name: '  Website  ', description: 'Redesign', extra: true });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ body: { name: 'Website', description: 'Redesign' } });
  });

  it('returns 400 with a message for an empty name', async () => {
    const res = await request(app).post('/projects').send({ name: '   ' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: { message: 'Invalid request body', fields: { name: 'Name is required' } },
    });
  });

  it('returns 400 for a name over 100 characters', async () => {
    const res = await request(app)
      .post('/projects')
      .send({ name: 'a'.repeat(101) });

    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).error.fields).toEqual({
      name: 'Name must be at most 100 characters',
    });
  });

  it('returns one message per field when several fail', async () => {
    const res = await request(app)
      .post('/projects')
      .send({ name: '', description: 'd'.repeat(2001) });

    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).error.fields).toEqual({
      name: 'Name is required',
      description: 'Description must be at most 2000 characters',
    });
  });

  it('returns 400 for a missing name', async () => {
    const res = await request(app).post('/projects').send({});

    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).error.fields).toEqual({ name: 'Name is required' });
  });

  it('returns 400 for a name that is not a string', async () => {
    const res = await request(app).post('/projects').send({ name: 42 });

    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).error.fields).toEqual({ name: 'Name must be a string' });
  });

  it('returns 400 without fields when the body is not an object', async () => {
    const res = await request(app).post('/projects');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { message: 'Invalid request body' } });
  });
});
