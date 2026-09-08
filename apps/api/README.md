# @workspace/api

NestJS HTTP backend for the monorepo template. Wires the cross-cutting infrastructure and
route-composes the bounded-context feature modules (`auth`, `identity`, `audit`, `notifications`,
`profiles`, `files`). See `CLAUDE.md`.

## Running locally

```bash
pnpm install
cp .env.example .env   # fill in local values
pnpm --filter @workspace/api start:dev
```

The app listens on `PORT` (default `3000`). Routes are served under the
`/api` global prefix (e.g. `/api/metrics` for Prometheus). Swagger UI is the
one exception — it bypasses the global prefix by design and is available at
`/docs` outside production.

## Commands

- `pnpm --filter @workspace/api check-types`
- `pnpm --filter @workspace/api build`
- `pnpm --filter @workspace/api lint`
- `pnpm --filter @workspace/api test`

See `CLAUDE.md` for architecture conventions and the repo root `CLAUDE.md`
for monorepo-wide rules.
