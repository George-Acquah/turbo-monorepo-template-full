# apps/landing

A generic public marketing site. Next.js App Router, Tailwind v4 (CSS-first), **Feature-Sliced
Design**. No business content — every string worth changing is a `[PLACEHOLDER]` token in
`src/shared/config/site.ts`, guarded by `isConfigured()`.

Standalone: depends on nothing from `packages/*` except `@workspace/eslint` and
`@workspace/typescript`. No API calls, no `@workspace/client-*`. It has its **own** small token
set in `src/styles/globals.css` (deliberately independent of `@workspace/client-theme` — a
marketing site usually wants its own look).

## Structure (FSD)

```
src/app/        routing only — each route re-exports its views slice
src/views/      one composition per route: home, terms, not-found
src/widgets/    self-contained blocks: site-header, site-footer, hero, feature-grid, cta-section
src/shared/     config/ (site.ts, env.ts), lib/ (cn, metadata, jsonld), ui/ (container, button)
src/styles/     globals.css (token set + Tailwind base)
```

Import direction is strict downward: `app → views → widgets → shared`. Every slice exposes a
public API via its `index.ts`; nothing reaches into another slice's `ui/`. There are no
`features/` or `entities/` layers yet — add them if the site grows interactive parts.

## Rules

- Keep `src/app/**` routing-only (`export { XPage as default } from '@/views/x'`).
- New generic UI a dashboard could also use belongs in `packages/client/ui/*`, not here.
- Replace `src/views/terms` with real, reviewed legal copy before launch — don't ship the
  placeholder. Do not author legal/compliance text without source material.
- Metadata / OG / JSON-LD come from `src/shared/lib/{metadata,jsonld}.ts` reading `site.ts` +
  `NEXT_PUBLIC_SITE_URL`.
