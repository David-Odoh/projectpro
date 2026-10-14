# ProjectPro: tech stack

Confirmed on 2026-10-13. Versions are the latest published on npm on that date, adjusted where two packages do not yet work together. The scope this stack serves is in [project-scope.md](project-scope.md).

## Version constraints

Three choices are deliberately not "the latest":

1. **Node 24 LTS.** Vite 8, Vitest 5, Prisma 7 and ESLint 10 all require Node 20.19 or newer, and Vitest 5 excludes the Node 25 line. Node 24 satisfies all of them. The repo carries an `.nvmrc`; run `nvm install 24` once, then `nvm use` in the project.
2. **Prisma 7.10, not 8.** npm's `latest` tag for Prisma points at a release candidate (8.0.0-rc.22), and Better Auth 1.7 and its Prisma adapter only accept Prisma 5 to 7.
3. **TypeScript 6.0, not 7.0.** typescript-eslint 8 only supports TypeScript below 6.1, so TypeScript 7 would leave the project without type-aware linting.

Revisit each one when the blocking package catches up.

## Runtime and tooling (both folders)

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 24 LTS (24.21.0) | Runtime for server, build and tests |
| npm | bundled with Node 24 | Package manager; separate `package.json` in `client/` and `server/` |
| TypeScript | 6.0.x (6.0.3) | Language for client and server |
| ESLint + typescript-eslint | 10.x + 8.x | Linting |
| Prettier | 3.x | Formatting |
| Vitest | 5.x | Test runner on both sides |

## Client (`client/`)

| Tool | Version | Purpose |
|---|---|---|
| React + React DOM | 19.x | UI |
| Vite | 8.x | Dev server and build; proxies `/api` to the server |
| React Router | 8.x | Routing (`/login`, `/register`, `/projects`) |
| TanStack Query | 5.x | Fetching and caching project data |
| Better Auth React client | 1.7.x | Sign-up, sign-in, sign-out, `useSession` |
| Tailwind CSS + `@tailwindcss/vite` | 4.3.x | Styling, through the Vite plugin (no PostCSS config) |
| shadcn/ui (`shadcn` CLI) | 4.21.x | UI components copied into `client/src/components/ui` |
| Zod | 4.x | Form validation for login, register and new project |
| React Hook Form + `@hookform/resolvers` | 7.x + 5.x | Form state, wired to Zod through `zodResolver` |
| React Testing Library | 16.x | Component and flow tests |

shadcn/ui is not a runtime dependency. Its CLI copies component source into the repo and installs what those components need: `radix-ui`, `lucide-react`, `class-variance-authority` and `tw-animate-css`. It requires an `@` path alias to `client/src`.

Components for the first milestone: button, input, textarea, label, field, card and dialog.

## Server (`server/`)

| Tool | Version | Purpose |
|---|---|---|
| Express | 5.x | HTTP API |
| Better Auth | 1.7.x | Email + password auth with database sessions |
| `@better-auth/prisma-adapter` | 1.7.x | Connects Better Auth to Prisma |
| Prisma + `@prisma/client` | 7.10.x | ORM and migrations |
| `@prisma/adapter-pg` + `pg` | 7.10.x + 8.x | Prisma's Postgres driver |
| Zod | 4.x | Request validation |
| tsx | 4.x | Runs TypeScript in development |
| Supertest | 7.x | API tests |

## Database and local infrastructure

| Tool | Version | Purpose |
|---|---|---|
| PostgreSQL | 18 (Homebrew `postgresql@18`) | Data store for users, sessions and projects; runs natively, no Docker |

## Conventions

- Zod is used on both sides, but the client and server keep separate schemas, since the two folders share no code.
- Sessions live in Postgres only. Better Auth's cookie cache stays off.

## Not included

No Redis or other session cache, no monorepo tool or shared package, no CI and no deployment target.
