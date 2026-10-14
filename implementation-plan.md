# ProjectPro: implementation plan for the first milestone

Agreed on 2026-10-13. The scope is in [project-scope.md](project-scope.md) and the stack in [tech-stack.md](tech-stack.md).

This plan breaks the first milestone (sign in, create a project, list projects) into small tasks grouped into phases, so each phase ends in something that can be checked before the next one starts. Tick a task when it is done.

## How the phases fit together

| Phase | Outcome | Depends on |
|---|---|---|
| 0. Environment | Node 24, git repo, README stub | none |
| 1. Server foundation | Express server answers a health check | 0 |
| 2. Client foundation | Styled React app shell with routing | 0 |
| 3. Local database | Postgres running in Docker Compose | 2 |
| 4. Database and auth | Sign-up, sign-in and sign-out work over HTTP | 1, 3 |
| 5. Projects API | Create and list projects, protected by session | 4 |
| 6. Client auth | Register, log in and log out in the browser | 2, 4 |
| 7. Client projects | Create and list projects in the browser | 5, 6 |
| 8. Finish | Docs, lint, full end-to-end check | 7 |

Phases 0 to 2 need no database. Docker is first required in Phase 3.

Before each phase that sets up a library (Prisma 7, Better Auth, Vite, Tailwind, shadcn/ui, TanStack Query, React Router), its current setup docs are checked through Context7.

## Phase 0: Environment

- [x] **0.1** Install Node 24 with `nvm install 24` and add `.nvmrc` containing `24`.
- [x] **0.2** Run `git init`; add a root `.gitignore` (`node_modules`, `dist`, `.env`, generated Prisma client).
- [x] **0.3** Add a root `README.md` stub with prerequisites.

**Check:** `node -v` prints v24; `git status` works.

## Phase 1: Server foundation

- [x] **1.1** Create `server/package.json`; install Express 5, Zod, tsx, TypeScript 6.0 and Vitest; add `dev`, `build`, `test` and `lint` scripts.
- [x] **1.2** Add `server/tsconfig.json` (strict, ES modules).
- [x] **1.3** Add `server/src/env.ts`: load and validate `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and `PORT` with Zod; add `server/.env.example`.
- [x] **1.4** Add `server/src/app.ts` (builds and exports the Express app, with `GET /api/health`) and `server/src/index.ts` (listens on `PORT`).
- [x] **1.5** Add `server/src/middleware/errorHandler.ts`: the `{ error: { message, fields? } }` format and a JSON 404.
- [x] **1.6** Configure ESLint and Prettier for the server.
- [x] **1.7** Add a Supertest test for `/api/health` and for the 404 format.

**Check:** `npm run dev` serves `GET /api/health`; `npm test` and `npm run lint` pass.

## Phase 2: Client foundation

- [x] **2.1** Scaffold `client/` with Vite's React + TypeScript template; pin TypeScript 6.0.
- [x] **2.2** Install Tailwind CSS and `@tailwindcss/vite`; add the plugin to `vite.config.ts` and `@import "tailwindcss"` to `src/index.css`.
- [x] **2.3** Add the `@` alias to `client/src` in `vite.config.ts` and the tsconfig files.
- [x] **2.4** Run `shadcn init`, then add button, input, textarea, label, field, card and dialog.
- [x] **2.5** Add the `/api` proxy to the server in `vite.config.ts`.
- [x] **2.6** Install React Router and TanStack Query; add `src/main.tsx` providers and `src/App.tsx` with placeholder routes for `/login`, `/register` and `/projects`.
- [x] **2.7** Add `src/components/AppLayout.tsx`: header with the app name and a slot for the user menu.
- [x] **2.8** Configure Vitest (jsdom) with React Testing Library, plus ESLint and Prettier; add one smoke test that renders the app.

**Check:** `npm run dev` shows a styled shell; navigating between the three routes works; `npm test`, `npm run lint` and `npm run build` pass.

## Phase 3: Local database

- [ ] **3.1** Add `docker-compose.yml` with a `postgres:18` service and a named volume.
- [ ] **3.2** Add an init script that creates the `projectpro` and `projectpro_test` databases.
- [ ] **3.3** Set `DATABASE_URL` in `server/.env` and `server/.env.example` to match the Compose service.
- [ ] **3.4** Add the Docker commands to the README stub.

**Check:** `docker compose up -d` starts Postgres and `psql` can connect to both databases.

## Phase 4: Database and auth

- [ ] **4.1** Install Prisma 7.10, `@prisma/client`, `@prisma/adapter-pg` and `pg`; add `server/prisma/schema.prisma` and `server/src/db.ts` (one shared Prisma client).
- [ ] **4.2** Install Better Auth and `@better-auth/prisma-adapter`; add `server/src/auth.ts` with email + password enabled, 7-day sessions, daily refresh and the cookie cache off.
- [ ] **4.3** Generate the `User`, `Session`, `Account` and `Verification` models with the Better Auth CLI.
- [ ] **4.4** Add the `Project` model (`id`, `name`, `description`, `createdById`, timestamps) with a relation to `User`.
- [ ] **4.5** Run the first migration against `projectpro`.
- [ ] **4.6** Mount the Better Auth handler on `/api/auth/*splat` in `app.ts`, before `express.json()`.
- [ ] **4.7** Add `server/src/middleware/requireAuth.ts`: look up the session with `auth.api.getSession`, return 401 without one, otherwise set `req.user`.
- [ ] **4.8** Add test setup that migrates `projectpro_test` and clears tables between tests.
- [ ] **4.9** Write auth tests: sign-up creates a user and a session row; sign-in sets a cookie; a wrong password is rejected; a duplicate email is rejected; sign-out deletes the session row.

**Check:** `GET /api/auth/ok` responds; auth tests pass; a `curl` sign-up followed by `get-session` with the cookie returns the user.

## Phase 5: Projects API

- [ ] **5.1** Add `server/src/projects/schema.ts`: Zod schema for create (name 1 to 100 characters, trimmed; description optional, up to 2,000).
- [ ] **5.2** Add `server/src/middleware/validate.ts`: turn Zod failures into a 400 with per-field messages.
- [ ] **5.3** Add `server/src/projects/service.ts`: `listProjects` (newest first, including the creator's name) and `createProject`.
- [ ] **5.4** Add `server/src/projects/routes.ts`: `GET` and `POST /api/projects` behind `requireAuth`; register it in `app.ts`.
- [ ] **5.5** Write project tests: 401 without a session; create returns 201 and records the creator; empty and over-long names return 400; the list is newest first; a second user sees the first user's projects; a deleted session row gives 401 on the next request.

**Check:** all server tests pass; the endpoints work from `curl` with a session cookie.

## Phase 6: Client auth

- [ ] **6.1** Add `src/auth/auth-client.ts` using `createAuthClient` from `better-auth/react`.
- [ ] **6.2** Add `src/auth/schemas.ts`: Zod schemas for login (email, password) and register (name, email, password with a minimum length matching Better Auth's).
- [ ] **6.3** Build `src/auth/RegisterPage.tsx` with React Hook Form, `zodResolver` and shadcn fields; show field errors and server errors (for example, email already in use).
- [ ] **6.4** Build `src/auth/LoginPage.tsx` the same way; show a single "invalid email or password" message on failure.
- [ ] **6.5** Add `src/auth/RequireAuth.tsx`: show a loading state while the session loads, redirect to `/login` when signed out; send signed-in users away from `/login` and `/register`.
- [ ] **6.6** Add the user's name and a log-out button to the header; log-out clears cached queries and returns to `/login`.
- [ ] **6.7** Write tests: validation messages appear; a successful login navigates to `/projects`; a signed-out visit to `/projects` redirects.

**Check:** in the browser, register, land on `/projects`, reload and stay signed in, log out, and log back in.

## Phase 7: Client projects

- [ ] **7.1** Add `src/api/client.ts`: a fetch wrapper that sends cookies, parses the error format and throws a typed error.
- [ ] **7.2** Add `src/projects/api.ts` and query hooks: `useProjects` and `useCreateProject` (invalidates the list on success).
- [ ] **7.3** Add `src/projects/schemas.ts`: Zod schema for the new-project form, with the same limits as the server.
- [ ] **7.4** Build `src/projects/ProjectList.tsx`: cards with name, description, creator and date; loading, error and empty states.
- [ ] **7.5** Build `src/projects/NewProjectForm.tsx` in a dialog: validation, a disabled submit button while saving, server errors mapped to fields, close and reset on success.
- [ ] **7.6** Assemble `src/projects/ProjectsPage.tsx` and wire it to the `/projects` route.
- [ ] **7.7** Write tests: empty state; list renders; a created project appears without a reload; an empty name shows an error and sends no request.

**Check:** in the browser, create a project and see it at the top of the list without a reload.

## Phase 8: Finish

- [ ] **8.1** Complete `README.md`: prerequisites, environment variables, first-time setup, run, test.
- [ ] **8.2** Add root convenience scripts to run and test both sides together.
- [ ] **8.3** Run lint, type-check, build and tests on both sides and fix what they report.
- [ ] **8.4** Walk through the "Done when" list in `project-scope.md` in the browser with two accounts.
- [ ] **8.5** Tick the tasks in `implementation-plan.md` and note anything deferred.

**Check:** every item in the scope document's "Done when" list passes.

## Risks to watch

- **Prisma 7 setup** differs from older versions (driver adapter, generated client location). Task 4.1 follows the current docs rather than older tutorials.
- **Better Auth handler order.** Mounting it after `express.json()` breaks sign-in silently; task 4.6 and the auth tests cover it.
- **Cookies in development** rely on the Vite proxy keeping requests same-origin. If the proxy is bypassed, sign-in appears to work but the session is not sent.
- **Server tests need Postgres running.** They use the separate `projectpro_test` database so they never touch development data.

## Verification of the whole milestone

- `docker compose up -d`, migrate, then `npm test` in `server/` and `client/`: all pass.
- With both dev servers running, complete the "Done when" list in `project-scope.md`.
- In the database: signing in adds a `session` row, signing out removes it, and deleting the row by hand makes the next `/api/projects` request return 401.
- The session cookie is httpOnly and holds an opaque token.
