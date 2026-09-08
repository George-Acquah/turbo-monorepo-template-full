---
name: feature-sliced-design
description: Enforces Feature-Sliced Design (FSD) for the Workspace frontend apps — apps/dashboard and apps/landing (both mandate FSD via their CLAUDE.md). Covers the layer/segment structure, the strict downward-import rule, the public-API-per-slice convention, and how app-local slices compose the packages/client/* foundation instead of duplicating it. Use when scaffolding a new page/widget/feature/entity in a frontend app, deciding where a piece of frontend code belongs, or reviewing a frontend PR for layer-boundary violations. See README.md in this folder for the fuller reference and rationale.
---

# Feature-Sliced Design for the Workspace frontend

Applies to `apps/dashboard` and `apps/landing`. The `pages` layer folder is named `views/`
in this repo (Next's `app/` owns routing; `views/` holds the compositions). `apps/landing` has
no `features`/`entities` layers yet — it's a static site — but the same `app → views → widgets
→ shared` direction and public-API-per-slice rule apply.

## The layer stack

Six layers, each only importable from the layers below it (never sideways within a layer,
never upward):

```
app        →  routing entry, providers, global styles/layout
pages      →  full-screen compositions (one slice per route)
widgets    →  large self-contained UI blocks composed from features + entities
features   →  one user action each (publish, assign, revoke, create, ...)
entities   →  business/domain concepts (programme, cohort, role, access-grant, ...)
shared     →  reusable, business-agnostic code — see the repo-specific twist below
```

**Repo-specific twist:** textbook FSD expects a `shared` layer inside each app holding a UI
kit, API client, and utils. Here, that already exists at the monorepo level as
`packages/client/*` (`client-ui-primitives/forms/overlays/table/pagination`, `client-api`,
`client-lib`, `client-types`, `client-hooks`, `client-theme`) — built specifically to be
shared across both dashboard apps. **Don't recreate a `shared` layer inside `apps/dashboard`
or `apps/dashboard`.** An app-local `shared/` should only exist for genuinely app-specific
glue (e.g. this app's root layout wiring `@workspace/client-theme`'s CSS import) — if
something in it is reusable across both dashboard apps, it belongs in `packages/client/*`
instead, not app-local `shared/`.

## Slice anatomy

Every slice (in `pages`/`widgets`/`features`/`entities`) is a folder, sliced into segments:

```
{layer}/{slice-name}/
├── ui/            # components
├── model/         # state, derived data, types local to this slice
├── api/            # data-fetching for this slice (wraps @workspace/client-api calls)
├── lib/            # slice-local helper functions
├── config/          # slice-local constants
└── index.ts        # THE public API — the only thing other slices may import
```

Only create the segments you need — most `features` slices are just `ui/` + a use of
`@workspace/client-api`, no `model/`/`lib/`/`config/`.

**The public API rule:** everything outside a slice imports from its `index.ts` only, never
reaches into `ui/` or `model/` directly.

```ts
// ✅ import { PublishProgrammeButton } from '@/features/publish-programme';
// ❌ import { PublishProgrammeButton } from '@/features/publish-programme/ui/publish-button';
```

## Import rule (strict downward only)

`app → pages → widgets → features → entities → packages/client/*`

- A `feature` may import `entities` and `packages/client/*`, never another `feature` or a
  `widget`/`page`.
- An `entity` may import only `packages/client/*` — never another `entity`, never a
  `feature`.
- Two slices in the same layer needing each other's logic is a signal to either extract the
  shared bit down a layer, or compose both from the layer above (a `widget` or `page`
  importing both `features`, not one `feature` importing the other).

## Next.js App Router

`src/app/**` stays **routing-only** — a route file imports and renders its matching `pages`
slice, nothing else:

```tsx
// src/app/programmes/page.tsx
import { ProgrammesPage } from '@/pages/programmes';
export default ProgrammesPage;
```

Real composition (data fetching, layout, widget assembly) lives in
`src/pages/programmes/ui/programmes-page.tsx`, not in the route file. This keeps the `pages`
slice testable independent of Next's routing conventions and keeps route files thin per the
existing convention in `apps/landing/CLAUDE.md` ("keep route files thin and compose from
page/section components").

## Deciding where new code goes

1. Is it reusable across `apps/dashboard` **and** `apps/dashboard`, and business-agnostic
   (styling, generic hook, API client behavior)? → `packages/client/*`, not the app.
2. Does it represent a domain concept with no user action attached (a programme, a role, a
   cohort)? → `entities/{name}`.
3. Does it perform one user action (publish, revoke, assign)? → `features/{verb-noun}`.
4. Does it combine several features/entities into one large reusable block (a data table
   with its own toolbar wired to a specific entity)? → `widgets/{name}`.
5. Is it one specific route's full composition? → `pages/{route-name}`.
6. Is it app-wide (providers, global layout, root error boundary)? → `app/`.

## Naming

- Slice folders: kebab-case (`publish-programme`, `access-grant`).
- Components: PascalCase, named after their slice where reasonable
  (`PublishProgrammeButton`, `ProgrammeCard`).
- `features` are named `{verb}-{noun}` (`publish-programme`, `assign-role`,
  `revoke-access-grant`), matching the action, not the entity.

## Enforcement

The dashboard app ships an FSD layout; wire an ESLint boundary rule before it grows. When `apps/dashboard` is scaffolded, add one before real
feature work starts — either the official FSD linter (Steiger) or a `packages/configs/eslint`
addition extending the same `import/no-restricted-paths`-zone pattern
`buildContextBoundaryZones` already uses for `modules/*` boundaries
(`packages/configs/eslint/base.ts`). Don't build that config blind against a nonexistent
app; do it against the first real slice structure.

See `README.md` in this folder for the full reference, a worked example tree, and the
rationale behind each repo-specific decision above.
