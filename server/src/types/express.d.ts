import type { AuthSession } from '../auth.js';

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth` for signed-in requests. */
      user?: AuthSession['user'];
    }
  }
}
