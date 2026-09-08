# Client Package Roadmap

Status of every `packages/client/*` package after this pass, plus the foundational
packages the original brief called for that aren't built yet and why. See
`decisions/adr-0001-table-engine.md` and `decisions/adr-0002-backoffice-app.md` for the
two accepted architecture decisions this roadmap assumes.

## Built / completed this pass

| Package | Responsibility | Depends on | Consumers |
|---|---|---|---|
| `@workspace/client-types` | Generated OpenAPI `paths`/`components`/`operations` (`pnpm --filter @workspace/client-types generate-openapi`, run against a live API) + hand-authored shared types the schema doesn't cover: `ApiResponseType` (the real runtime envelope — Swagger only documents each route's inner payload), `PaginatedResponse`/`CursorPaginatedResponse`, `ActionState`, `RealtimeEvent`. | — | `client-api`, `client-lib`, `client-hooks`, `client-ui-pagination` |
| `@workspace/client-api` | Fully-typed API client on `openapi-fetch` + `paths` — no hand-maintained endpoint map; call `client.GET('/programmes')` etc. directly. `unwrap()` reconciles the client-types/Swagger gap (schema says inner payload, wire says envelope) in one place. `mapArray`/`mapPaginated` normalize list results. | `client-types`, `openapi-fetch` | Both apps, any server action / route handler |
| `@workspace/client-lib` | Domain zod validation schemas (auth, catalog, identity, memberships, profiles, audit — mirroring the real backend DTOs), logger, server-action result helpers, general utils (`formatCurrency`, `slugify`, ...). | `client-types`, `zod` | Both apps, forms |
| `@workspace/client-hooks` | `useRealtimeStream` (SSE), `useDebouncedValue`, `useClickAway`, `useMediaQuery`, `useIsMobile`, `useToggle`, `usePrevious`. | `client-types` | Both apps |
| `@workspace/client-theme` | Design tokens (light/dark, chart ramp, spacing/density, radius, motion) as Tailwind v4 CSS + a small TS export for JS consumers (chart colors). New this pass — see its own README. | — | Both apps' global stylesheet |
| `@workspace/client-ui-primitives` | Base shadcn-style components on `@base-ui/react` (avatar, badge, breadcrumb, button, card, checkbox, label, scroll-area, separator, skeleton, sonner toaster, tabs). | `@base-ui/react` | `client-ui-forms`, `client-ui-overlays`, `client-ui-table`, apps |
| `@workspace/client-ui-forms` | Input, textarea, field-error, input-group, a fully custom `Select`. | `client-ui-primitives` | `client-ui-overlays`, `client-ui-table`, apps |
| `@workspace/client-ui-overlays` | Dialog, alert-dialog, sheet, tooltip, popover, dropdown-menu, command palette, a from-scratch date-picker. | `client-ui-primitives`, `client-ui-forms` | `client-ui-table`, apps |
| `@workspace/client-ui-table` | Presentational table primitives + `DataTable` (sort/filter/search/visibility/ordering/resizing/selection/bulk-actions/expand/group/density/loading-error-empty/virtualization) on `@tanstack/react-table`. | `client-ui-primitives`, `client-ui-overlays`, `client-ui-forms`, `@tanstack/react-table`, `@tanstack/react-virtual` | Both apps, wherever a list screen exists |
| `@workspace/client-ui-pagination` | `usePagination({strategy:'page'\|'infinite'})` — one hook, two strategies matching the two server pagination contracts. `<Pagination>` (Next Link-based) + `<InfiniteScrollTrigger>`. | `client-types`, `client-ui-primitives`, `next` (peer) | `client-ui-table`'s `footer` slot, apps |

## Catalogued, not built this pass

These need a real consuming screen to design a sensible API against — building them blind
(before `apps/dashboard` or `apps/dashboard` exist) risks guessing wrong and having to
redo them against the first real page. Each row is a starting point, not a spec.

| Package (proposed) | Responsibility | Why it's deferred |
|---|---|---|
| `client-ui-layout` | App shell: collapsible sidebar, top bar, responsive breakpoints. `@workspace/client-theme` already has `--sidebar*` tokens reserved for this. | No app exists yet to shape the shell against (single-workspace nav vs. multi-tenant, what lives in the top bar, etc.). |
| `client-ui-navigation` | Nav item list, active-route highlighting, permission-gated item visibility (reading `modules/identity` roles/permissions via `client-api`). | Same — depends on the shell existing first, and on which routes the first real app screens actually need. |
| `client-ui-command-palette` | App-wide `Cmd+K` composition on top of `client-ui-overlays`'s existing `Command`/`CommandDialog` primitives (already built, just not wired to a global shortcut + a real command list). | The command list itself only makes sense once there are real pages/actions to jump to. |
| `client-ui-charts` | Recharts (or similar) wrapper pre-themed with `@workspace/client-theme`'s `chartColors`. | No real chart requirement yet (no analytics/dashboard screen built); premature to pick a chart library's specific API surface without one. |
| `client-ui-metrics` | Stat-tile / KPI-row components (the "N active cohorts", "GHS X this month" pattern). | Same — needs a real dashboard screen's actual metrics to shape the API (single value vs. trend vs. sparkline). |
| `client-ui-filters` | Structured filter-bar UI beyond what `DataTable`'s built-in column filtering covers (e.g. saved filter presets, cross-field filters). | `DataTable` already covers per-column + global search; a dedicated filters package is only worth it once a screen needs more than that. |
| `client-auth-ui` | Login/register/claim-account forms wired to `client-lib`'s auth schemas + `client-api`'s `/auth/*` routes. | Needs `apps/dashboard`'s actual auth flow (redirect targets, error UX) to shape correctly. |

Already covered by existing packages, despite being named separately in the original
brief: **Dialogs/Drawers/Toasts** (`client-ui-overlays`'s `Dialog`/`Sheet`,
`client-ui-primitives`'s `sonner` `Toaster`), **Badges/Tags** (`client-ui-primitives`'s
`Badge`), **Date Pickers** (`client-ui-overlays`'s custom `DatePicker`), **Permission
Gates** (data exists via `modules/identity`'s roles/permissions through `client-api`; a
`<PermissionGate>` component is a `client-ui-navigation`/app-level concern once there's a
real permission list to gate against, not a new package), **Icons**
(`lucide-react` is the established convention across every `client-ui-*` package already).
