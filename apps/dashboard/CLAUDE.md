# apps/dashboard

## What this is

The authenticated Next.js App Router surface, built from `packages/client/*`. It ships as a
**shell + stubs** — clone or extend it for your product's screens. It is a heavy consumer of the
client foundation; strict Feature-Sliced Design.

## Real and working (the reusable core)

- **Auth & session**: login / register / claim-account / verify-email / logout, the RSC
  data-fetching layer (`src/shared/api/server.ts`, `cache()`d, single-use refresh-token
  rotation), and proactive edge token refresh in `src/proxy.ts` (Next 16 middleware).
- **Shell**: `MemberShell` (rename to taste) — the "detached rounded glass" layout with
  floating sidebar / topbar / scrollable main, mobile bottom tab bar, command palette, skip
  link, navigation progress bar. Plus the reusable widgets: `page-header`, `panel`,
  `section-grid`, `stat-tile`, `empty-state`, `error-state`, `page-skeleton`, `auth-shell`,
  `account-nav`, `responsive-menu`, `bento-grid`, `coming-soon`, `email-verification-banner`.
- **Both access-gate patterns** ship: the onboarding gate (`(dashboard)/layout.tsx` redirects
  to `/welcome` while `account.onboardedAt` is unset) and a permission gate
  (`src/shared/lib/require-permission.ts` → `notFound()` when the caller lacks a key; call it
  as the first statement in a gated view).
- **Notifications**: the in-app feed (`widgets/notifications-list` / `notifications-menu`) is
  real against `modules/notifications`' HTTP surface, with live updates over SSE via
  `useRealtimeStream`. `widgets/notification-preferences-panel` persists per-category delivery.
- **Account**: `/account` (profile form) + `/account/preferences` (theme, notification
  channels) hit `GET/PATCH /v1/preferences` and `/v1/notification-preferences`.
- **Onboarding**: `/welcome` (its own `(onboarding)` group), a two-step skippable flow
  (welcome → two profile questions) then `POST /v1/account/complete-onboarding` → `/`.

## Stubs (replace these)

- `views/dashboard` — static placeholder tiles + a "getting started" panel. No API call.
- `src/shared/config/navigation.ts` — three example nav items + the permission-gated helpers.
- `src/entities/*` — `account`, `user`, `consent`, `file` only, each a one-line
  `components['schemas'][...]` re-export showing the narrowing pattern.

## Rules

- **Feature-Sliced Design, strictly** — see the `feature-sliced-design` skill for the layer
  structure and import rules, and `dashboard-ui` for the visual language + stack traps.
- `src/app/**` is routing-only: each route re-exports its `src/views` slice.
- Data layer is hybrid: RSC reads via `@/shared/api/server`, mutations via server actions,
  TanStack Query only inside small interactive client islands. Keep `'use client'` boundaries small.
- Consume `@workspace/client-types` + `@workspace/client-api` — never hand-rolled fetch.
- Enforce access **server-side against backend state**. Never hardcode role/permission strings
  in components; never bypass a paywall/subscription/enrolment check for local convenience.
- Never run repo-wide scripts by default.

## Note

The committed `@workspace/client-types` `openapi-types.ts` still describes the fuller endpoint
surface of the source project. Regenerate it against your own running API
(`pnpm --filter @workspace/client-types generate-openapi`); until then, calls to endpoints your
API doesn't serve will typecheck but 404 at runtime.
