# ProjectPro: scope for the first milestone

Agreed on 2026-10-13.

## Goal

A project management web app for a small software team. The first milestone delivers one thing end to end: a signed-in team member can create a project and see the list of existing projects. It also sets up the structure (separate client and server, a relational database, user accounts) that tasks, reporting and workflow features will build on later.

## Decisions

| Area | Choice |
|---|---|
| Client | React + Vite, TypeScript, in `client/` |
| Server | Node + Express, TypeScript, in `server/` |
| Database | PostgreSQL, accessed through Prisma |
| Authentication | Email + password through Better Auth |
| Sessions | Stored server-side in Postgres; no JWT |
| Project fields | Name and description |

## In scope

**Accounts**
- Register with name, email and password; log in; log out.
- Better Auth handles sign-up, sign-in, sign-out and password hashing.
- Sessions are rows in the Postgres `session` table. The browser holds only an opaque session token in an httpOnly cookie, and every authenticated request is checked against the database.
- Sessions last 7 days and are extended once a day while in use. Logging out deletes the session row, so it takes effect immediately.
- Better Auth's cookie cache stays off (its default). Turning it on would put signed session data in the cookie and delay revocation.
- All project endpoints and the projects page require a signed-in user.

**Projects**
- Create a project: name (required, 1 to 100 characters), description (optional, up to 2,000 characters).
- List all projects, newest first, showing name, description, creator and creation date.
- Every signed-in user sees every project. There is one team and no per-project permissions.

**Client screens**
- `/register` and `/login`: forms with inline validation errors.
- `/projects`: the list, an empty state, and a "New project" form. The list updates after a create without a page reload.
- Signed-out visitors are redirected to `/login`. The header shows the current user and a log-out button.

**Foundation**
- Input validation on the server, with consistent JSON error responses for the project endpoints.
- Database migrations, and a setup script that creates the local Postgres role and databases.
- Tests for the API and for the main client flows.
- A README with setup and run instructions.

## Out of scope (later milestones)

- Editing, archiving or deleting projects
- Tasks, reporting and workflows
- Roles, permissions, multiple teams, invitations
- Password reset, email verification, social login, two-factor
- Search, filtering, pagination
- Deployment, CI and production hosting

## Assumptions to confirm

- **Open sign-up.** Anyone who can reach the app can register and then see all projects. This is fine for local or internal use; it needs an invite or allow-list before the app is exposed publicly.
- **No email verification**, so an account works as soon as it is created.

## Structure

```
projectpro/
  project-scope.md          this document
  tech-stack.md             tools and versions
  implementation-plan.md    phased task list
  README.md
  client/                   React + Vite + TypeScript
    src/
      components/ui/        shadcn/ui components
      api/                  fetch wrapper and project calls
      auth/                 auth-client.ts, RequireAuth, Login and Register pages
      projects/             ProjectsPage, ProjectList, NewProjectForm
      App.tsx               routes
  server/                   Express + TypeScript
    prisma/schema.prisma    Better Auth models plus Project, migrations
    src/
      auth.ts               Better Auth instance (Prisma adapter, email + password)
      app.ts                Express app (exported for tests)
      index.ts              starts the server
      middleware/           requireAuth, validate, errorHandler
      projects/             routes and service
```

**Libraries.** Server: Express, Better Auth with its Prisma adapter, Prisma, Zod. Client: React Router, TanStack Query, Better Auth's React client, Tailwind CSS, shadcn/ui, and Zod with React Hook Form for forms. Tests: Vitest on both sides, Supertest on the server, React Testing Library on the client. Versions and the reasons behind them are in [tech-stack.md](tech-stack.md).

**Wiring**
- The Better Auth handler is mounted on `/api/auth/*` before `express.json()`, because the body parser would otherwise consume the request before Better Auth reads it.
- A `requireAuth` middleware looks up the session with `auth.api.getSession`, returns 401 when there is none, and otherwise attaches the user to the request.
- The Better Auth CLI generates the `User`, `Session`, `Account` and `Verification` Prisma models; `Project` is added by hand and Prisma migrations apply the lot.
- The client uses Better Auth's React client for sign-up, sign-in, sign-out and reading the session.
- The Vite dev server proxies `/api` to Express, so the cookie is same-origin in development and no CORS setup is needed.

## Data model

| Table | Owner | Key columns |
|---|---|---|
| `user` | Better Auth | `id`, `name`, `email` (unique), `emailVerified`, `createdAt`, `updatedAt` |
| `session` | Better Auth | `id`, `token` (unique), `userId`, `expiresAt`, `ipAddress`, `userAgent` |
| `account` | Better Auth | `id`, `userId`, `providerId`, `password` (the hash for email + password accounts) |
| `verification` | Better Auth | required by the library, unused in this milestone |
| `project` | App | `id` (uuid), `name`, `description` (nullable), `createdById` (references `user`), `createdAt`, `updatedAt` |

## API

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/api/auth/sign-up/email` | Create an account and sign in | No |
| POST | `/api/auth/sign-in/email` | Sign in | No |
| POST | `/api/auth/sign-out` | Delete the session | Yes |
| GET | `/api/auth/get-session` | Return the current session and user | Yes |
| GET | `/api/projects` | List projects, newest first | Yes |
| POST | `/api/projects` | Create a project | Yes |

The `/api/auth/*` routes are provided by Better Auth and keep its response format. The project routes return errors as `{ "error": { "message", "fields"? } }`, with 400 for validation and 401 for unauthenticated.

## Done when

- A signed-out visitor to `/projects` is redirected to `/login`.
- A new account lands on an empty projects list.
- Creating a project makes it appear at the top of the list without a reload.
- An empty project name shows a validation error and creates nothing.
- A second account sees the first account's projects, with the creator's name.
- Signing in adds a row to `session`, signing out removes it, and deleting the row by hand makes the next project request return 401.
- The test suites pass in both `client/` and `server/`.
