# ProjectPro

A small project tracker: sign in, create a project, list projects.

- Scope: [project-scope.md](project-scope.md)
- Stack: [tech-stack.md](tech-stack.md)
- Plan: [implementation-plan.md](implementation-plan.md)

## Prerequisites

- **Node.js 24 LTS**, with the npm that ships with it. The repo carries an `.nvmrc`, so with [nvm](https://github.com/nvm-sh/nvm):

  ```sh
  nvm install 24   # once
  nvm use          # in the project folder
  ```

- **Git**
- **PostgreSQL 18**, running natively on the default port, 5432. No Docker. The steps below use [Homebrew](https://brew.sh) on macOS; on other systems, install Postgres 18 with your package manager and run the same `psql` command.

## First-time setup

Run these from the repo root, once.

### 1. Install and start Postgres 18

```sh
brew install postgresql@18
brew services start postgresql@18   # also starts it at login
```

The formula is keg-only, so put its tools (`psql` and friends) on `PATH`:

```sh
echo 'export PATH="$(brew --prefix postgresql@18)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
psql --version   # should print 18.x
```

Only one Postgres can listen on port 5432. If another version is already running there, stop it first (for example `brew services stop postgresql@14`).

### 2. Create the database role and databases

```sh
psql -d postgres -f server/db/setup.sql
```

This creates a `projectpro` role (password `projectpro`, local development only) and two databases: `projectpro` for development and `projectpro_test` for the test suite. It is safe to run again.

### 3. Configure the server

```sh
cp server/.env.example server/.env
sed -i '' "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=$(openssl rand -base64 32)|" server/.env
```

The second line fills in `BETTER_AUTH_SECRET` with a random value (on Linux, drop the `''` after `-i`). The other defaults in `.env` already match the local setup. The client needs no `.env`.

### 4. Install dependencies

```sh
nvm use
(cd server && npm install)
(cd client && npm install)
```

### 5. Generate the Prisma client and migrate the database

```sh
cd server
npm run db:generate   # writes the Prisma client to src/generated/prisma (not committed)
npx prisma migrate deploy
cd ..
```

Run `npm run db:generate` again whenever `server/prisma/schema.prisma` changes or after a fresh clone. Without it, the server, tests and build fail with a missing `generated/prisma` import.

## Run the apps

Use two terminals, each from the repo root. Postgres must be running.

```sh
# Terminal 1: API on http://localhost:3000
cd server && npm run dev
```

```sh
# Terminal 2: web app on http://localhost:5173
cd client && npm run dev
```

Open http://localhost:5173. The client forwards `/api` requests to the server, so always use the client's address in the browser; sign-in relies on it.

To check both are up:

```sh
curl http://localhost:5173/api/health    # {"status":"ok"}
curl http://localhost:5173/api/auth/ok   # {"ok":true}
```

## Test, lint and build

Run in `server/` or `client/`:

```sh
npm test         # server tests use the projectpro_test database and migrate it automatically
npm run lint
npm run build
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `psql: command not found` | Open a new terminal or `source ~/.zshrc` after step 1. |
| `connection refused` on port 5432 | Start Postgres: `brew services start postgresql@18`. |
| `role "projectpro" does not exist` | Run step 2. |
| `Cannot find module '.../generated/prisma/client.js'` | Run `npm run db:generate` in `server/`. |
| `Invalid environment variables` on server start | `server/.env` is missing or `BETTER_AUTH_SECRET` is empty; redo step 3. |
| `relation "user" does not exist` | Run `npx prisma migrate deploy` in `server/`. |
| Sign-in returns 403 | The request's origin isn't trusted. Use http://localhost:5173, or set `CLIENT_ORIGIN` in `server/.env` to the address you use. |
