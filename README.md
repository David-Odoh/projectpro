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
- **PostgreSQL 18**, installed with Homebrew (`brew install postgresql@18`). Not needed until the database is added.

## Setup

To be completed as the milestone is built.

### Database

Postgres 18 runs natively on the default port, 5432. The `postgresql@18` formula is keg-only, so put its tools on `PATH` first:

```sh
echo 'export PATH="/opt/homebrew/opt/postgresql@18/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Then, once:

```sh
brew install postgresql@18
brew services start postgresql@18
psql -d postgres -f server/db/setup.sql   # creates the projectpro role and databases
```

`setup.sql` is safe to run again. Copy `server/.env.example` to `server/.env`; its `DATABASE_URL` already points at the local server.
