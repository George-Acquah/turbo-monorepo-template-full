---
name: implement-frontend-feature
description: Add a page, section, or interactive feature to apps/landing, the only implemented workspace frontend.
---

# Implement a Frontend Feature

## Which app

`apps/landing` (Next.js 16, React 19, Tailwind CSS 4) is the **only implemented frontend app** in this
repo today. `apps/members` (authenticated member portal) is a placeholder with no code — see its
`CLAUDE.md`. The repo standard for *new* frontend areas is FSDD (Feature-Sliced Design); when
`apps/members` is scaffolded it should follow strict FSDD. `apps/landing` predates that standard and
keeps its existing structure below — don't mass-migrate it to FSDD.

There is no `apps/web` dashboard, no `entities/features/shared` FSDD layout, and no `@workspace/client-*`
packages (`client-api`, `client-types`, `client-lib`) in this repo — those don't exist.

## `apps/landing` real structure

```
src/app/**                         ← routes (App Router)
src/app/(site)/layout.tsx           ← site shell
src/components/layout/**            ← navbar, footer, legal layout, not-found
src/components/ui/**                ← reusable primitives (Field, Select, Logo, GridBg, gsap/*, ...)
src/components/sections/**          ← marketing page sections (hero, pricing, faq, curriculum, ...) — GSAP-heavy
src/components/pages/**             ← page-specific composition (enrol/, events/, programs/, community/, legal/, masterclass/)
src/features/**                     ← cross-cutting interactive features (morph-grid/, overscroll/), each with hooks/ ui/ utils/ constants.ts types.ts index.ts
src/config/**                       ← app config and env wrappers (src/config/app/index.ts has known placeholder contact/legal data)
src/lib/data/**                     ← programme/event data (program-data.ts, events-data.ts)
src/lib/api/**                      ← request helpers (request.ts, errors.ts)
src/lib/validation/**                ← validation helpers (email.ts, ...)
src/styles/**                       ← global styles
```

Real example of an existing feature slice for reference: `src/components/pages/enrol/` (enrolment
flow — `enrol-flow.tsx`, `schema.ts`, `state.ts`, `pricing.ts`, `paystack-popup.tsx`, section
components under `sections/`) plus `src/app/programs/[program-slug]/enrol/actions.ts` (server action)
and `src/app/programs/[program-slug]/enrol/api/{payments,enrolment}.client.ts` (API request helpers).
Use this as the model for a comparable page/feature rather than inventing a new layout.

## Investigation phase

Before writing code:

1. Read a comparable existing section/page under `components/sections/` or `components/pages/` and
   match its pattern.
2. Check `src/lib/data/` for existing programme/event data before adding new hardcoded content.
3. Check `src/components/ui/` for an existing primitive before creating a new one.
4. If the feature needs a server action, look at
   `src/app/programs/[program-slug]/enrol/actions.ts` for the current pattern (Next.js server action,
   not a separate `apps/web`-style `actions/*.actions.ts` file with a shared `ActionState` type — that
   convention doesn't exist here).

---

## Adding a page section

```
src/components/sections/<section-name>/<SectionName>.tsx
src/components/sections/<section-name>/index.ts   (barrel, if the folder has multiple files)
```

- Prefer server components by default; add `'use client'` only when the component needs state,
  effects, browser APIs, or GSAP-driven animation.
- Compose sections into a page under `src/app/**`; keep route files thin.

## Adding a page-specific feature (e.g. a new enrolment step, a new legal page layout)

```
src/components/pages/<area>/<Component>.tsx
```

Follow the pattern of an existing sibling in the same `components/pages/<area>/` directory.

## Adding a cross-cutting interactive feature

```
src/features/<feature>/
├── hooks/
├── ui/
├── utils/
├── constants.ts
├── types.ts
└── index.ts
```

Model this on `src/features/morph-grid/` or `src/features/overscroll/`.

## Enrolment/payments constraints

- Programme data comes from `src/lib/data/program-data.ts`; enrolment routes live under
  `src/app/programs/[program-slug]/enrol/**`.
- Paystack Inline powers the current payment UI. **Never** collect raw card details in the frontend.
- The backend must own pricing; a client-side payment "success" popup alone is never sufficient —
  payment success must be verified server-side.

## Known stale placeholders (don't extend these assumptions)

- `src/config/app/index.ts` — placeholder contact/legal/business details.
- `src/config/seo.config.ts` — leftover unrelated electrical-service content from a template.
- Existing UK/England/Wales copy in some legal/marketing content — Ghana is the source-of-truth
  jurisdiction unless a task explicitly says otherwise.

## Content and compliance

Do not author trading advice, performance claims, pass-rate claims, or regulatory claims without
explicit source material.

---

## Verification

```bash
pnpm --filter @workspace/landing check-types   # tsc --noEmit
pnpm --filter @workspace/landing lint
```

**Do not run** `pnpm --filter @workspace/landing build` (full Next.js build — slow) just to validate
types; `check-types` is sufficient. **Do not run** repo-wide `pnpm check-types`/`pnpm lint`.
