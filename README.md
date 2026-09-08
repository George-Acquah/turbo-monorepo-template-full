# Monorepo Template

A reusable full-stack monorepo skeleton — **architecture and cross-cutting infrastructure only,
no business domain**.

- **pnpm + Turborepo** workspace, Node 22.
- **Backend**: NestJS, ports/adapters, `modules/{context}` bounded contexts, a transactional-outbox
  + domain-event bus, split across `apps/api` (HTTP) and `apps/worker` (event dispatch / reactions).
- **Frontend**: a layered `packages/client/*` UI + typed-API foundation, feeding `apps/dashboard`
  (authenticated, Feature-Sliced Design) and `apps/landing` (marketing site).
- **Ships**: auth, identity/RBAC, audit, notifications, profiles, files. Nothing else.

See `CLAUDE.md` for the full package/app map and conventions, `docs/architecture/layers.md` for how
the layers fit, `modules/CLAUDE.md` for the bounded-context rules, and `TEMPLATE-STATUS.md` for what
is verified vs. stubbed.

## Start a project from this template

1. **Copy it** somewhere new and (if you want history) `git init`.
2. **Rename the namespace.** Repo-wide, excluding `node_modules`/`.git`/`dist`:
   - `@workspace/` → `@yourscope/` (every `package.json`, import, tsconfig path)
   - `workspace_` → `yourscope_` (Postgres schema prefixes in `packages/server/infrastructure/databases/prisma/prisma/schema/*.prisma`, `packages/server/constants/src/database/*`, and any raw SQL)
   - `workspace/event-ownership` → `yourscope/event-ownership` and `plugins: { workspace: … }` in `packages/configs/eslint/base.ts`
   - `workspace.` event-name prefix in `packages/server/types/src/events/domain-events.constants.ts`
   - `app_` cookie names in `apps/dashboard/src/shared/lib/cookie-names.ts` / `src/widgets/member-sidebar/config` if you want a product-specific prefix
3. **Install**: `pnpm install`
4. **Build the ESLint config first** (every flat config imports its compiled output):
   `pnpm --filter @workspace/eslint build`
5. **Set env**: copy each `apps/*/.env.example` to `.env` and fill in `DATABASE_URL`,
   `MONGO_*`, `REDIS_*`, `ORIGIN_AUTH_SECRET`, etc.
6. **Database**: with `DATABASE_URL` pointing at an empty Postgres,
   `pnpm --filter @workspace/prisma prisma:generate` then
   `pnpm --filter @workspace/prisma prisma:migrate:dev` (creates the initial migration),
   then `pnpm --filter @workspace/prisma generate:postgres-constants`.
7. **Seed** (optional): `pnpm --filter @workspace/seed seed` (roles/permissions + a bootstrap admin —
   set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).
8. **Regenerate API types**: start `apps/api` (`pnpm --filter @workspace/api start:dev`), then
   `pnpm --filter @workspace/client-types generate-openapi`. The committed `openapi-types.ts` still
   describes the template's endpoints until you do this.
9. **Run**: `pnpm --filter @workspace/api start:dev`, `pnpm --filter @workspace/worker start:dev`,
   `pnpm --filter @workspace/dashboard dev`, `pnpm --filter @workspace/landing dev`.

## Add a bounded context

`domain → application → presentation` inside `modules/<context>`, persistence behind a
`packages/server/infrastructure/persistence/<context>` adapter and `packages/server/ports/src/database/schema/<context>`
ports, a `<context>.prisma` schema file, events in `packages/server/types/src/events/`. Wire the
HTTP root into `apps/api/src/router.module.ts` and the worker root + subscriptions into
`apps/worker/src/{workers,events-routing}.module.ts`. Full rules in `modules/CLAUDE.md`.

## Low-RAM rule

Prefer focused `pnpm --filter @workspace/<name> <script>` runs. Avoid root `pnpm build` / `lint` /
`check-types` / `test` and bare `turbo run` — they are denied in `.claude/settings.json`.
