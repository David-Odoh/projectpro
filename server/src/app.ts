import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import { auth } from './auth.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { meRouter } from './routes/me.js';
import { projectsRouter } from './projects/routes.js';

export const app = express();

app.disable('x-powered-by');

// Better Auth reads the raw request body, so it must be mounted before express.json().
app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/me', meRouter);
app.use('/api/projects', projectsRouter);

app.use(notFound);
app.use(errorHandler);
