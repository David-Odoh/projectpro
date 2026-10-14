import { Router } from 'express';
import { requireAuth, signedInUser } from '../middleware/requireAuth.js';

export const meRouter = Router();

// Only the fields the client needs; the rest of the user row stays on the server.
meRouter.get('/', requireAuth, (req, res) => {
  const { id, name, email } = signedInUser(req);
  res.json({ user: { id, name, email } });
});
