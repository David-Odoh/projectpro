# ProjectPro

Scope is in [project-scope.md](project-scope.md), versions in [tech-stack.md](tech-stack.md) and the phased task list in [implementation-plan.md](implementation-plan.md).

## Use Context7 to resolve package names

Before installing, configuring or writing code against any package, resolve its name through the Context7 MCP server instead of relying on memory:

1. Call `resolve-library-id` with the package's official name and what you need from its docs.
2. Pick the best match: exact name, high source reputation, high benchmark score. Use a version-specific ID (`/org/project/version`) when it matches the version pinned in `tech-stack.md`.
3. Call `query-docs` with that ID, one concept per query.

Do this even for well-known packages (Express, React, Vite, Prisma, Better Auth, Tailwind, shadcn/ui, TanStack Query, React Router, Zod, Vitest, ESLint). Their setup has changed across recent major versions, so older patterns are often wrong.

If no library ID fits after three attempts, say so and fall back to the package's own documentation rather than guessing.
