---
name: dashboard-ui
description: The visual + structural design language for Workspace's dashboard apps (apps/dashboard) — "detached rounded glass surfaces" on an ambient-lit dark canvas, with a mobile experience that behaves like a native app (bottom tab bar, bottom sheets, safe areas). Covers shell anatomy, the glass recipe, token rules, motion, the RSC client-boundary rule, and six stack traps that break rendering silently (Tailwind @source scanning, buttonVariants in RSC, Base UI render/Menu.Group, missing popover/card tokens, CommandDialog wiring). Use when building or reviewing ANY screen or component in apps/dashboard, or when adding components to packages/client/ui/*.
---

# Workspace Dashboard UI

Applies to **`apps/dashboard`** and **`apps/dashboard`**. Not `apps/landing` (marketing site,
own language). Structure rules live in the `feature-sliced-design` skill — this one is about
how it **looks, feels, and moves**, plus the traps in this specific stack.

## The core idea: detached rounded **glass** surfaces

The page background is the **canvas**, carrying soft brand-coloured ambient light. Every
functional region is a frosted panel floating on it, separated by a gap. Nothing is
full-bleed; nothing is divided by a hard 1px rule.

**Glass needs three things together, or it reads as flat grey** — this is the single most
common way "glassmorphism" fails:
1. a translucent fill,
2. a backdrop blur, **and**
3. a hairline edge highlight to catch the light.

Plus a fourth, easy to forget: **something behind it worth blurring.** A blur over a flat
opaque background does nothing. That's what `ambient-canvas` is for.

Use the utilities, don't hand-roll: `.glass` (panels, sidebar, cards), `.glass-strong`
(topbar, sheets — anything overlaying scrolling content), `.ambient-canvas` (once, on the
shell root). All defined in `packages/client/theme/src/tokens.css`.

```
body.bg-background                                  ← the canvas
└── div.flex.h-dvh.gap-2 lg:gap-3.p-2 lg:p-3        ← padding + gap IS the detached look
    ├── aside  .glass rounded-xl   w-64 / w-[4.5rem] collapsed, shrink-0, hidden lg:flex
    └── div.flex-1.flex.flex-col.gap-2 lg:gap-3.min-w-0
        ├── header .glass-strong rounded-xl  h-14 shrink-0
        └── main   .glass rounded-xl  flex-1 overflow-y-auto min-h-0   ← ONLY this scrolls
                                                          (+ pb-24 lg:pb-6 for the tab bar)
[fixed] MobileNavBar  .glass pb-safe  bottom-0 lg:hidden
```

Reference implementation: `apps/dashboard/src/widgets/member-shell/ui/member-shell.tsx`.

## Non-negotiable rules

1. **Separate with gap + translucency, never a hard border.** Panels use `.glass`, whose
   1px edge is a *highlight*, not a divider. The opaque ladder
   (`background` → `surface` → `surface-2`) still applies wherever glass isn't appropriate.
   Never add a `border` to divide layout regions.
2. **Everything is rounded.** Panels `rounded-xl` (18px), controls/nav items `rounded-lg`
   (12px). No square corners anywhere.
3. **Only `<main>` scrolls.** Sidebar and topbar are fixed. Never let the shell
   double-scroll.
4. **Dark is the primary mode, but never pure black.** The canvas is `oklch(0.17)`.
   In dark mode elevation reads through *lightness steps*, not shadows — shadows barely
   register. `shadow-elevation-1/2` is mostly a light-mode tool.
   ⚠️ Any "floating panel" surface must be **lighter** than `--background`. Making
   `--sidebar` darker than the canvas was a real bug: the panel receded and the detached
   effect vanished.
5. **Semantic tokens only.** Never a raw hex/oklch literal in a component. Use
   `bg-surface`, `text-muted-foreground`, `bg-sidebar-accent`, `text-success`,
   `bg-chart-3`, … all defined in `packages/client/theme/src/tokens.css`.
6. **Never rely on colour alone.** A delta gets an arrow icon *and* a colour; a status gets
   a label *and* a tone.
7. **Numbers use `font-mono` + `tabular-nums`** so figures align in columns.

## Motion

- Durations: `duration-(--duration-fast)` (120ms) for hover/colour, `(--duration-base)`
  (200ms) for layout (e.g. sidebar width). Easing: `ease-out` (the Expo-out curve
  `cubic-bezier(0.16,1,0.3,1)`, mapped as a Tailwind utility).
- Press feedback is already `active:scale-[0.97]` inside the `Button` primitive.
- `prefers-reduced-motion` is globally honoured in `tokens.css` — don't fight it.
- Animate `opacity`/`transform`/`width`, not `height`.

## Client boundary (this is a performance rule, not a style one)

Server components by default. `'use client'` **only** on interactive leaves, each in its own
file so the bundle stays small:

- Server: shells, page compositions, panels, headers, stat tiles, empty states, nav lists.
- Client: anything using `usePathname`/`useState`/handlers — nav items, toggles, menus,
  drawers, the command palette, tables.

A widget may be *mixed*: a server `member-topbar.tsx` rendering client `user-menu.tsx` and
`mobile-title.tsx`. Prefer that over marking the whole widget client.

## Mobile must feel like an app, not a shrunken desktop

This is a hard requirement, not a nicety. Below `lg`:

- **Navigation is a bottom tab bar**, not a hamburger drawer. Thumb-reachable, always
  visible, max 5 tabs — 4 primary destinations + "More" opening a bottom sheet.
  See `widgets/mobile-nav-bar`.
- **The header is an app header**: current section title on the left, icon actions on the
  right. No nav in it.
- **Overlays become bottom sheets.** A header-anchored dropdown is a web pattern and reads
  wrong on a phone. Use `widgets/responsive-menu`: anchored dropdown on `lg+`, bottom sheet
  below. Sheets get a **grab handle** (`h-1 w-9 rounded-full`) — that's the affordance that
  says "drag to dismiss".
- **Respect safe areas** — `pb-safe` on anything pinned to the bottom, so it clears the home
  indicator. `<main>` needs bottom padding to clear the tab bar (`pb-24 lg:pb-6`).
- **Touch targets ≥44px** (`min-h-12` rows, `min-h-14` tabs) and `active:scale-[0.97]` for
  press feedback — mobile has no hover, so the press state is the only feedback.
- `overscroll-contain` on scrollers to stop scroll chaining.

**Render both branches and toggle with CSS** (`lg:hidden` / `hidden lg:block`) rather than a
media-query hook — SSR-safe, no hydration mismatch, no first-paint flash. `display:none`
also removes the inactive branch from the accessibility tree, so duplicate `aria-label`s
are not a problem.

## Stack traps — read before debugging styling

Each of these cost real debugging time; all six are fixed in the repo now — don't
reintroduce them. Every one of them passed typecheck and `next build`.

1. **Tailwind must be told to scan the client-ui packages.** They ship raw TSX and Tailwind
   v4 ignores `node_modules`. Without `@source` lines in the app's `globals.css`, utilities
   used *only* inside those packages are never generated — components render half-styled
   (classes present in the DOM, `position: static`). See
   `apps/dashboard/src/styles/globals.css`. **Add the same block to any new app.**
2. **`buttonVariants` must stay outside `'use client'`.** It lives in
   `packages/client/ui/primitives/src/components/button-variants.ts` precisely so RSCs can
   *call* it. You cannot call a function exported from a client module on the server.
3. **A link styled as a button is an `<a>`, not a `<button>`.** Use
   `<Link className={cn(buttonVariants({ variant, size }))}>`. Do **not** use
   `<Button render={<Link/>}>` — Base UI warns that it loses native button semantics.
   Conversely `DropdownMenuTrigger`/`SheetTrigger` `render={<Button/>}` is correct.
   Note `TooltipTrigger` accepts `nativeButton` in its types but doesn't consume it — it
   leaks to the DOM as an unknown attribute, so don't pass it.
4. **`DropdownMenuLabel` must be wrapped in `DropdownMenuGroup`.** It renders Base UI's
   `Menu.GroupLabel`, which *throws* outside a `Menu.Group` — and that exception takes the
   entire popup down. Symptom: the trigger flips `aria-expanded="true"` but no content ever
   mounts. This silently broke both header menus.
5. **The theme must define every token the UI packages reference.** They were written
   against a shadcn-style set and use `popover`/`popover-foreground`/`card`/
   `card-foreground` — none of which existed here at first, so `bg-popover` resolved to
   nothing and every dropdown, select, popover and card rendered with **no background**.
   When adding a component to `packages/client/ui/*`, check its tokens exist in
   `tokens.css`.
6. **`CommandDialog` needs the cmdk `<Command>` root inside it**, and `DialogTitle`/
   `Description` *inside* `DialogContent` (they register with the dialog context). Both
   were wrong originally; the palette could never have worked.

## Building blocks (compose, don't reinvent)

From `apps/dashboard/src/widgets/*`: `page-header`, `panel`, `stat-tile`, `empty-state`,
`section-grid`. From `packages/client/ui/*`: `Button`, `Badge`, `Avatar`, `Card`,
`Skeleton`, `ScrollArea`, `Tabs`, `Breadcrumb`, `Separator`; `Dialog`, `Sheet`,
`DropdownMenu`, `Tooltip`, `Popover`, `Command`, `DatePicker`; `DataTable`; `Pagination`.

Every screen starts with `<PageHeader>` and lays content out in `<Panel>`s inside a
`space-y-6` column.

## Accessibility floor

Skip-to-content link; `aria-current="page"` on active nav; visible `focus-visible` rings
(`ring-ring`); ≥44px touch targets on mobile (`min-h-11`); icon-only buttons need
`aria-label`; `sr-only` titles for dialogs/drawers; ⌘K exposed via `aria-keyshortcuts`.

## Verify visually — build passing is not enough

Typecheck and `next build` passed while the command palette was completely broken and the
sidebar was invisible against the canvas. **Screenshot the result** (headless Chrome +
puppeteer are available; see the members shell work) at 1440px and 390px, and capture
`console`/`pageerror` events — that is how all three stack traps above were found.
