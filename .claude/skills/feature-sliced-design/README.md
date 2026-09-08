# Feature-Sliced Design at Workspace

Full reference for how [Feature-Sliced Design](https://feature-sliced.design) (FSD) applies
to Workspace's dashboard apps. `SKILL.md` in this folder is the condensed, load-on-demand
version of this document — read this one for the rationale, the worked example, and the
parts that are repo-specific rather than textbook FSD.

## Scope

- **Applies to:** every frontend app — `apps/dashboard` and `apps/landing`. `apps/landing`
  is a static site with only `app` / `views` / `widgets` / `shared` layers so far; add
  `features` / `entities` if it grows interactive parts.
- The `pages` layer folder is named **`views/`** in this repo (`app/` is Next routing-only).
- **Mandate source:** root `CLAUDE.md` and each app's `CLAUDE.md`. This skill makes the
  policy concrete and actionable.

## Why FSD, and why it fits here particularly well

FSD's core promise is that a codebase stays navigable as it grows, by making two things
explicit instead of implicit: **what depends on what** (the layer stack), and **what's
public vs. internal to a piece of code** (the per-slice public API). Two things about this
repo make that especially valuable:

1. **Multiple dashboard surfaces can share almost everything below the `entities` layer.** `apps/dashboard`
   read from the same backend modules
   (`audit`/`auth`/`catalog`/`identity`/`memberships`/`profiles`) through the same
   generated `@workspace/client-api` client. FSD's strict layering is what keeps that
   sharing honest — `packages/client/*` (this repo's `shared` layer) can't quietly grow an
   app-specific assumption, because nothing above it is allowed to reach back down into it
   except through its published exports.
2. **The backend already enforces an equivalent boundary.** `modules/{context}` packages
   are ESLint-boundary-enforced so one bounded context can't reach into another's
   internals (`packages/configs/eslint/base.ts`'s `buildContextBoundaryZones`, documented
   in `modules/CLAUDE.md`). FSD is the same idea applied to the frontend — this isn't a new
   philosophy for the repo, it's the existing one extended forward.

## The layer stack, in depth

Ordered highest (most composed) to lowest (most primitive). An import may only point
**downward**.

### `app`
App-wide setup: the root layout, global providers (theme, query client, auth context),
global error boundaries, global styles import (`@workspace/client-theme/tokens.css`). In
Next.js App Router terms, this is `src/app/layout.tsx` and anything it directly composes —
not the route segment files themselves (see "Next.js App Router" below).

### `pages`
One slice per route — the full composition for that screen: which widgets/features it
shows, in what layout, with what data-fetching orchestration. Example slices for
`apps/dashboard`: `pages/programmes` (the programme catalog), `pages/account` (profile +
consents), `pages/access` (the member's own access grants/subscriptions). For
`apps/dashboard`: `pages/roles`, `pages/audit-logs`, `pages/access-grants`.

### `widgets`
Large, reusable, self-contained UI blocks assembled from `features` + `entities`, used by
one or more `pages`. The line between a `widget` and a `page` slice: a `page` slice is
route-specific glue (layout + which widgets go where); a `widget` is itself reusable if a
second route ever needed it. Example: `widgets/programme-table` (a `DataTable` from
`@workspace/client-ui-table`, wired to the `programme` entity, with publish/archive actions
and a search toolbar) could be reused by both a member-facing catalog page and a backoffice
programme-management page.

### `features`
One user action each — named `{verb}-{noun}`. Each feature slice owns everything needed to
perform that one action: the trigger UI (a button, a form, a confirm dialog) and the
`@workspace/client-api` call + `@workspace/client-lib` validation schema behind it. Examples:
`features/publish-programme`, `features/assign-role`, `features/revoke-access-grant`,
`features/record-consent`. A feature slice is deliberately small and single-purpose —
resist the urge to grow one into a mini-CRUD-module; a second action on the same entity is
a second feature slice, not a bigger one.

### `entities`
Business/domain concepts with no action attached — the "noun," not the "verb." Holds the
entity's canonical UI representation (a card, a status chip composition, a table-row cell
renderer) built on the domain type from `@workspace/client-types`'s generated `components`.
Examples: `entities/programme`, `entities/cohort`, `entities/masterclass`,
`entities/access-grant`, `entities/role`. An entity slice never performs a mutation itself
— that's what a `feature` composing it is for.

### `shared` — this repo's twist
Textbook FSD keeps a `shared` layer inside the app for the UI kit, API client instance, and
generic utilities. **Here, that's `packages/client/*`, not an app-local folder:**

| Textbook `shared/` content | Where it actually lives here |
|---|---|
| UI kit (buttons, inputs, dialogs, table) | `@workspace/client-ui-primitives`, `-forms`, `-overlays`, `-table`, `-pagination` |
| API client instance + generated types | `@workspace/client-api`, `@workspace/client-types` |
| Domain-agnostic validation, formatting, logging | `@workspace/client-lib` |
| Design tokens / theme | `@workspace/client-theme` |
| Generic hooks | `@workspace/client-hooks` |

Reasoning: both dashboard apps need identical versions of all of the above — a per-app
`shared/` would either duplicate it (drift risk) or become the de facto cross-app package
anyway, just without the workspace boundary enforcement `packages/client/*` already has. If
you're about to add something to an app-local `shared/` folder, ask first whether it
belongs in `packages/client/*` instead — the answer is almost always yes unless it's
genuinely tied to one app (e.g. that app's specific root-layout wiring).

## Slice segments

Inside any `pages`/`widgets`/`features`/`entities` slice:

- **`ui/`** — components.
- **`model/`** — local state, derived/computed values, types scoped to this slice (not
  shared entity types — those come from `@workspace/client-types`).
- **`api/`** — this slice's data-fetching, built on `@workspace/client-api`'s generated
  client (`client.GET('/programmes')`, etc.) — not raw `fetch`, not a new client instance.
- **`lib/`** — slice-local helper functions that don't belong in `@workspace/client-lib`
  because they're not reusable outside this slice.
- **`config/`** — slice-local constants.

Only create the segments a slice actually needs. Most `features` slices are `ui/` plus a
couple of lines calling `@workspace/client-api` — no `model/`, no `lib/`.

## The public API rule

Every slice's `index.ts` is the *only* thing anything outside the slice may import. This is
the mechanism that makes the layer/import rules actually enforceable and refactor-safe —
without it, "don't import sideways" is just a convention nobody checks.

```ts
// entities/programme/index.ts
export { ProgrammeCard } from './ui/programme-card';
export { ProgrammeStatusChip } from './ui/programme-status-chip';
export type { ProgrammeSummary } from './model/types';
```

```ts
// ✅ features/publish-programme importing the entity's public API
import { ProgrammeStatusChip } from '@/entities/programme';

// ❌ reaching past the public API into the entity's internals
import { ProgrammeStatusChip } from '@/entities/programme/ui/programme-status-chip';
```

## Import rule — the full matrix

| From \ To | `app` | `pages` | `widgets` | `features` | `entities` | `packages/client/*` |
|---|---|---|---|---|---|---|
| `app` | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| `pages` | ❌ | same-layer only via public API, prefer not to | ✅ | ✅ | ✅ | ✅ |
| `widgets` | ❌ | ❌ | same-layer only via public API, prefer not to | ✅ | ✅ | ✅ |
| `features` | ❌ | ❌ | ❌ | ❌ (see below) | ✅ | ✅ |
| `entities` | ❌ | ❌ | ❌ | ❌ | ❌ (see below) | ✅ |

Same-layer imports (`features` → `features`, `entities` → `entities`) are the one row
marked "❌ (see below)" rather than a flat no: they're not fully banned by the methodology,
but treat a same-layer import as a smell. Almost always the right fix is one of:

- Extract the shared piece down a layer (two features both needing the same confirm-dialog
  pattern → that pattern probably belongs in `packages/client/client-ui-overlays`, not
  duplicated, and not imported feature-to-feature).
- Compose both from above instead of one importing the other (a `widget` or `page` using
  both `features/publish-programme` and `features/archive-programme` side by side, rather
  than one feature importing the other).

## Next.js App Router

Next's file-system router (`src/app/**`) and FSD's `pages` layer both want to own "what a
route renders." Resolve the tension by keeping `src/app/**` **routing-only**:

```tsx
// src/app/programmes/page.tsx — routing glue only
import { ProgrammesPage } from '@/pages/programmes';

export default ProgrammesPage;
```

```tsx
// src/pages/programmes/ui/programmes-page.tsx — the real composition
import { ProgrammeTableWidget } from '@/widgets/programme-table';

export function ProgrammesPage() {
  return <ProgrammeTableWidget />;
}
```

Metadata exports, `generateStaticParams`, layouts, and other Next-specific route-file
concerns stay in `src/app/**` since Next requires them there — only the actual rendered
composition moves to the `pages` slice. This mirrors `apps/landing/CLAUDE.md`'s existing
"keep route files thin" convention, just applied through FSD's specific layer boundary
instead of a looser `components/pages` split.

## Worked example — a possible `apps/dashboard` tree

```
apps/dashboard/src/
├── app/
│   ├── layout.tsx                          # imports @workspace/client-theme/tokens.css, providers
│   ├── programmes/
│   │   ├── page.tsx                        # → pages/programmes
│   │   └── [slug]/page.tsx                 # → pages/programme-detail
│   └── account/page.tsx                    # → pages/account
│
├── pages/
│   ├── programmes/
│   │   ├── ui/programmes-page.tsx
│   │   └── index.ts
│   ├── programme-detail/
│   │   ├── ui/programme-detail-page.tsx
│   │   └── index.ts
│   └── account/
│       ├── ui/account-page.tsx
│       └── index.ts
│
├── widgets/
│   └── programme-table/
│       ├── ui/programme-table-widget.tsx    # DataTable from client-ui-table, wired to
│       │                                     # entities/programme + features/publish-programme
│       └── index.ts
│
├── features/
│   ├── publish-programme/
│   │   ├── ui/publish-programme-button.tsx
│   │   ├── api/publish-programme.ts        # client.POST('/programmes/{slug}/publish')
│   │   └── index.ts
│   ├── update-account/
│   │   ├── ui/update-account-form.tsx        # zod schema from @workspace/client-lib
│   │   ├── api/update-account.ts
│   │   └── index.ts
│   └── record-consent/
│       ├── ui/consent-toggle.tsx
│       ├── api/record-consent.ts
│       └── index.ts
│
└── entities/
    ├── programme/
    │   ├── ui/programme-card.tsx
    │   ├── ui/programme-status-chip.tsx      # wraps StatusChip from client-ui-table
    │   ├── model/types.ts                    # narrows components["schemas"]["ProgrammeResponse"]
    │   └── index.ts
    └── access-grant/
        ├── ui/access-grant-row.tsx
        └── index.ts
```

No `shared/` folder — everything that would live there is `packages/client/*` instead.

## Common mistakes

- **Putting a generic component in an app-local `shared/`.** If it's not tied to one app's
  specifics, it belongs in `packages/client/ui/*`.
- **A `feature` importing another `feature`.** Extract down or compose from above (see the
  import matrix).
- **Reaching into a slice's `ui/`/`model/` from outside it.** Always go through `index.ts`.
- **Putting page-specific data-fetching orchestration inside `src/app/**`.** That belongs
  in the matching `pages` slice's `model/`/`api/`.
- **A `feature` slice growing into a mini-CRUD module.** One action per feature slice; a
  second action is a second slice.
- **Re-deriving a type that already exists in `@workspace/client-types`.** Entity `model/`
  segments should narrow/extend the generated `components["schemas"][...]` types, not
  redefine them from scratch.

## Enforcement (future work, not done yet)

The dashboard app ships an FSD layout; wire an ESLint boundary rule before it grows. When `apps/dashboard` is scaffolded and has a real first
slice structure, add boundary enforcement before feature work scales up — either:

- **[Steiger](https://github.com/feature-sliced/steiger)**, FSD's own official linter
  (purpose-built for exactly this layer/import/public-API rule set), or
- An addition to `packages/configs/eslint` extending the same
  `import/no-restricted-paths`-zone approach `buildContextBoundaryZones` already uses for
  `modules/*` (`packages/configs/eslint/base.ts`) — consistent with how the backend side of
  this repo already enforces its own bounded-context boundaries.

Verify exact package names/versions at adoption time rather than assuming what's current.
