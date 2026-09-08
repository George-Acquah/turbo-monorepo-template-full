# @workspace/client-theme

Design tokens for the dashboard apps (`apps/members`, and the future `apps/backoffice`).
Distinct from `apps/landing`'s marketing-site tokens (`apps/landing/src/styles/theme.css`) —
inspired by the same OKLCH-driven approach, but a cooler blue/teal palette, denser spacing,
sidebar-aware surfaces, and a chart color ramp suited to long working sessions over financial
data. See `docs/client-foundation/decisions/adr-0001-table-engine.md` and
`docs/client-foundation/package-roadmap.md` for the wider architecture this package sits in.

## Usage

**1. Import the CSS once**, in the consuming app's global stylesheet, alongside Tailwind
itself — same pattern `apps/landing` uses for its own `theme.css`:

```css
/* apps/members/src/styles/globals.css */
@import 'tailwindcss';
@import '@workspace/client-theme/tokens.css';
```

Every token becomes both a CSS custom property (`var(--primary)`, `var(--chart-1)`, ...) and a
Tailwind utility (`bg-primary`, `text-muted-foreground`, `rounded-lg`, ...).

**2. Wire real fonts.** The CSS only declares the variable *names* (`--font-sans`,
`--font-heading`, `--font-mono`) with system-font fallbacks. Load the actual font files with
`next/font/google` in the consuming app and bind them to the same variable names, exactly how
`apps/landing/src/app/layout.tsx` wires `--font-manrope`:

```ts
import { Inter, Manrope, IBM_Plex_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono-dashboard', display: 'swap' });
```

(`--font-sans`/`--font-heading`/`--font-mono` in `tokens.css` reference `--font-inter`,
`--font-manrope`, `--font-mono-dashboard` with a `var(..., fallback)` — so this step is
optional; without it, tokens.css's system-font fallbacks apply.)

**3. Toggle density**, table density modes and any other density-aware component read
`--density-scale`, set via `[data-density]`:

```tsx
<div data-density="compact">...</div>
```

**4. JS-side values** (chart color arrays, canvas/SVG drawing) — import from the package root
instead of reading `var(--x)`:

```ts
import { chartColors, semanticColors } from '@workspace/client-theme';
```

## Token groups

- **Core surfaces**: `background`, `foreground`, `surface`, `surface-2`, `muted`, `border`,
  `input`, `ring`
- **Sidebar**: `sidebar`, `sidebar-border`, `sidebar-accent`, ... — a dedicated surface so a
  future navigation/layout package doesn't fight the content area's tokens
- **Brand**: `primary`, `secondary`, `accent` (+ `-foreground` pairs)
- **Semantic**: `success`, `warning`, `destructive`, `info` (+ `-foreground` pairs)
- **Charts**: `chart-1..8`, fixed lightness/chroma with stepped hue (categorical-palette best
  practice — every series reads as the same visual weight)
- **Radius**: `radius`, `radius-sm/md/lg/xl`
- **Motion**: `duration-fast/base/slow`, `ease-out`, `ease-in-out`
- **Spacing/density**: `space-1..12`, `density-scale`

Light and dark are both fully defined (`.dark` class). Dark mode leans on surface-lightness
steps for elevation rather than shadows, which barely register on dark backgrounds — light
mode uses the `elevation-1`/`elevation-2` soft, navy-tinted shadow tokens instead.
