import express from 'express';
import { errorHandler, notFound } from './middleware/errorHandler.js';

export const app = express();

app.disable('x-powered-by');
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(notFound);
app.use(errorHandler);
