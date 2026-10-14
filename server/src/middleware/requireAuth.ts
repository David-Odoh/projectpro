import { fromNodeHeaders } from 'better-auth/node';
import type { Request, RequestHandler } from 'express';
import { auth } from '../auth.js';
import { HttpError } from './errorHandler.js';

// Checks the session cookie against the session table on every request; no cookie cache.
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) {
    throw new HttpError(401, 'Not signed in');
  }

  req.user = session.user;
  next();
};

// For handlers behind requireAuth: returns req.user, which the type system can't know is set.
export function signedInUser(req: Request) {
  if (!req.user) {
    throw new HttpError(401, 'Not signed in');
  }
  return req.user;
}
