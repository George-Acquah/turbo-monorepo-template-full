# ADR-0002: Two consuming apps share the client foundation — Member + Backoffice

**Status:** Accepted
**Date:** 2026-07-23

## Context

Root `CLAUDE.md`'s "Current Apps" list has `apps/landing`, `apps/api`, `apps/dashboard`
(placeholder), `apps/worker` — no `apps/dashboard` exists or is scaffolded. But the
backend already has real admin-surface modules with no member-facing use: `identity`
(roles, permissions, API clients/keys, user-role assignment), `audit` (log/event search),
and admin-only routes inside `catalog` (programme/cohort/masterclass/price-plan create,
update, publish/archive) and `memberships` (`access-grants`, distinct from the
self-service `access` routes). None of this belongs in a member-facing app.

## Decision

Design the client packages (table, pagination, theme, api client, types) assuming **two**
future Next.js apps share them: `apps/dashboard` (self-service — programmes, own access
grants/subscriptions, account, consents) and a **not-yet-created** `apps/dashboard`
(admin — identity/roles/permissions, audit search, catalog authoring, access-grant
management), distinguished by role/permission gating sourced from `modules/identity`'s
roles/permissions and `modules/memberships`'s access grants — not by hardcoded per-page
checks (consistent with `apps/dashboard/CLAUDE.md`'s existing access-control rule).

## Consequences

**Positive**

- Every `packages/client/*` package (types, api, lib, hooks, theme, ui/*) is designed with
  two real, different consumers in mind from the start — catches accidental
  member-app-only or admin-app-only assumptions early (e.g. `client-api`'s generated
  client already covers both self-service and admin routes since it's generated from the
  full OpenAPI schema).
- `@workspace/client-theme` (light/dark, chart colors, density modes including a genuinely
  dense "compact" mode) directly targets the admin app's denser, longer-session use case
  the brief called out, not just the member app's presumably lighter-weight views.

**Negative / accepted**

- `apps/dashboard` itself is not created in this pass (explicitly out of scope — see root
  plan). This ADR records an assumption the package design leans on, not a commitment to
  build the app next.
- If `apps/dashboard` never materializes and admin functionality instead lives inside
  `apps/dashboard` behind role gating, no client package built in this pass needs to change —
  they're app-agnostic — but this ADR's premise should be revisited before any
  `apps/dashboard` scaffolding actually starts.
