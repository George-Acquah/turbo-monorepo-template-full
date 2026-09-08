# Client Foundation — Documentation Set

**Status:** Foundation packages complete; consuming apps not yet built
**Last updated:** 2026-07-23

## What this is

The reusable `packages/client/*` foundation that `apps/dashboard` and a future
`apps/dashboard` compose screens from, rather than each app growing its own one-off UI,
API client, and validation layer. Covers: generated API client + types, domain validation,
design tokens, and a full-featured data table + pagination system.

- [`package-roadmap.md`](package-roadmap.md) — every `packages/client/*` package's status,
  API surface, dependencies, and consumers; plus the packages the original brief called
  for that are deliberately deferred, and why.
- [`decisions/adr-0001-table-engine.md`](decisions/adr-0001-table-engine.md) — why
  `@tanstack/react-table` + `@tanstack/react-virtual`.
- [`decisions/adr-0002-backoffice-app.md`](decisions/adr-0002-backoffice-app.md) — the
  two-app (Member + Backoffice) assumption the package design leans on.

Each package also has its own `README.md` with a quick-start and full API notes:
`packages/client/theme`, `packages/client/ui/table`, `packages/client/ui/pagination`.

## What changed in this pass, briefly

`packages/client/*` existed as scaffolding copied from a different, unrelated project (a
school-fees SaaS, referred to internally as "Orvex") — wrong domain endpoints/validation,
an empty shared-types package that broke every downstream package's typecheck, no table
engine, no design tokens, and only an offset/page-number pagination component with no
cursor/infinite-scroll counterpart. This pass:

1. Got `apps/api` running locally (new `workspace_dev` Postgres database, migrations
   applied, dedicated a pre-existing `pnpm dedupe`-fixable duplicate-`@nestjs/core`
   dependency bug blocking boot) so real OpenAPI generation had something to point at.
2. Replaced the hand-maintained endpoint map with a generated one (`openapi-typescript` +
   `openapi-fetch`), and the school-fees domain content with the real six live backend
   modules (`audit`, `auth`, `catalog`, `identity`, `memberships`, `profiles`).
3. Authored the missing shared types, unblocking `client-api`/`client-hooks`/`client-lib`/
   `client-ui-pagination`'s typecheck.
4. Built `@workspace/client-theme` (new), completed `@workspace/client-ui-table`'s
   `DataTable`, and unified `@workspace/client-ui-pagination`'s two strategies.

Not in scope this pass: `apps/dashboard`/`apps/dashboard` themselves, any bot/indicator
feature, backend changes to make an endpoint actually return `PaginationResult<T>`, and
the packages `package-roadmap.md` catalogues as deferred.
