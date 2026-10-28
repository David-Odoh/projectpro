import { createAuthClient } from 'better-auth/react';

// Same-origin on purpose: Vite proxies /api to the server, so the session cookie is sent.
// Better Auth appends its default /api/auth base path, matching the server's mount point.
export const authClient = createAuthClient({
  baseURL: window.location.origin,
});

export const { signUp, signIn, signOut, useSession, getSession } = authClient;
