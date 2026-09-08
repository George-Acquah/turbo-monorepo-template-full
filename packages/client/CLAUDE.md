# packages/client

## What This Area Is

Shared frontend building blocks for the dashboard apps — `apps/members` and
`apps/backoffice` compose screens from these instead of each app growing its own
one-off API client, validation layer, design tokens, or UI kit. See
`docs/client-foundation/README.md` (plus `package-roadmap.md` and the ADRs alongside it)
for the deeper rationale and per-package status; this file covers the shape and the
rules for working in these packages day to day.

## Architecture

- `types` - generated OpenAPI types (`paths`/`components`/`operations`) plus
  hand-written shared types (`envelope.ts`, `pagination.ts`, `actions.ts`,
  `realtime.ts`). `src/openapi-types.ts` is generated via
  `pnpm --filter @workspace/client-types generate-openapi`, which runs
  `openapi-typescript` against a **locally running** `apps/api`'s `/docs-json`. The
  file header says "do not make direct changes" — treat that as load-bearing; if the
  API contract changed, regenerate, don't hand-edit.
- `api` - typed API client built on `types`: `createApiClient` (server/RSC),
  `createClientFetcher` (browser), `unwrap`, `mapArray`/`mapPaginated`, `ApiError`.
- `hooks` - shared React hooks: `useDebouncedValue`, `useClickAway`, `useMediaQuery`,
  `useIsMobile`, `useToggle`, `usePrevious`, and `useRealtimeStream` (SSE).
- `lib` - redacting logger, per-domain zod validation schemas (audit, auth, billing,
  catalog, enrolments, events, files, identity, learning, memberships, profiles),
  action/util helpers.
- `theme` - OKLCH design tokens (CSS + JS) for the dashboard apps.
- `turnstile` - Cloudflare Turnstile React widget.
- `ui/primitives` → `ui/forms` / `ui/overlays` → `ui/pagination` / `ui/table` / `ui/charts` -
  a layered component library (shadcn/base-ui-style primitives, composed upward into
  forms/overlays, then into the data-table/pagination system and recharts-based charts).
  Layering is directional: a lower layer must not import from a higher one.

## Commands

Two different build shapes exist in this tree — don't assume one script signature for
every package:

- `client-api`, `client-hooks`, `client-lib`, `client-types` bundle via **tsdown**
  (`build` / `dev --watch` → `dist/*.mjs`).
- `client-theme`, `client-turnstile`, and all `ui/*` packages ship raw TS/TSX from
  `src/index.ts` — their `build`/`dev` just run `tsc --noEmit` (typecheck only, no
  bundling); consuming apps pull the source directly via Next's `transpilePackages`.

Run only focused package commands:

- Typecheck: `pnpm --filter @workspace/<package-name> check-types`
- Build: `pnpm --filter @workspace/<package-name> build`
- Lint: `pnpm --filter @workspace/<package-name> lint`
- Regenerate OpenAPI types (needs `apps/api` running locally):
  `pnpm --filter @workspace/client-types generate-openapi`

Do not run repo-wide scripts by default.

## Conventions

- Do not import from `apps/**` into any `packages/client/*` package.
- Keep each package's public surface intentional through `src/index.ts` and
  `package.json` exports.
- Consuming apps use `@workspace/client-types` + `@workspace/client-api` for all backend
  calls — no hand-rolled `fetch`, no scattered raw API calls in components. This is the
  producing-side half of the rule `apps/members/CLAUDE.md` and
  `apps/backoffice/CLAUDE.md` already state for consumers.
- Prefer `@workspace/client-lib`'s zod schemas over redefining domain validation locally.
- Strict TypeScript; avoid `any`.
- For UI work, follow the `workspace-dashboard-ui` skill (visual/structural language) and
  the `feature-sliced-design` skill (how app-local slices compose these packages)
  instead of restating those conventions here.

## Tests

No package under `packages/client/*` currently has a wired test harness. If a change
needs coverage and a harness doesn't exist, say so explicitly rather than inventing a
repo-wide test setup or skipping coverage silently.
