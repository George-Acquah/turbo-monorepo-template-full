# ADR-0001: Table engine — `@tanstack/react-table` (+ `@tanstack/react-virtual`)

**Status:** Accepted
**Date:** 2026-07-23

## Context

`packages/client/ui/table` shipped as presentational-only: `Table`/`TableRow`/`TableCell`/...
are thin wrappers around native HTML table elements with zero sort/filter/selection/
pagination-integration logic — functionally equivalent to shadcn/ui's stock `<Table>`
primitives. Every future data-heavy screen in `apps/dashboard` and the future
`apps/dashboard` (programme lists, cohort rosters, role/permission admin, audit log
search, access-grant management) needs sorting, filtering, global search, column
visibility/ordering/resizing, row selection with bulk actions, expandable/grouped rows,
and — for the largest tables (audit logs) — virtualization. Building all of this by hand is
a large, easy-to-get-subtly-wrong surface (sort/filter/selection state interactions,
accessibility, keyboard nav).

## Decision

Adopt **`@tanstack/react-table`** as the headless state/logic engine underneath the
existing presentational primitives, and **`@tanstack/react-virtual`** as an opt-in
virtualization layer for large datasets. `DataTable` (new, in the same package) composes
both with the primitives and with `@workspace/client-ui-primitives`/`client-ui-overlays`
(checkboxes, badges, avatars, dropdown menus) into one importable component; the bare
presentational primitives remain available directly for tables with no interactive
behavior.

## Consequences

**Positive**

- Headless: `@tanstack/react-table` owns state/logic only, so the existing presentational
  primitives (already used, already styled to the design system) stay the render layer —
  no visual rewrite, no new component library to theme.
- Sort/filter/selection/visibility/ordering/resizing/grouping/expansion are native
  features, not hand-rolled — far less surface area to get wrong or maintain.
- Framework-agnostic core with a thin React binding; well-maintained, ~15kb, no dependency
  on a specific data-fetching library, matching this repo's ports/adapters preference for
  narrow, swappable pieces.
- `@tanstack/react-virtual` pairs naturally (same maintainer, same integration pattern) for
  the one genuinely large-dataset case (audit logs) without pulling in a heavier
  data-grid library.

**Negative / accepted**

- New dependency surface (`@tanstack/react-table`, `@tanstack/react-virtual`) in
  `packages/client/ui/table`.
- Virtualization requires switching table layout to CSS grid/flex (`VirtualizedBody`/
  `VirtualizedHeader`), which can reduce the implicit ARIA table semantics browsers derive
  from `<table>`/`<tr>`/`<td>` — accepted as an explicit opt-in (`virtualized` prop), not
  the default path, and documented in `VirtualizedBody`'s docstring.
- No saved-views persistence — `useDataTable`'s `state`/`onStateChange` expose a
  serializable snapshot, but there's no backend feature to save it to yet (see
  `package-roadmap.md`).

## Alternatives considered

- **Custom-built headless logic** — full control, but reimplements what
  `@tanstack/react-table` already solves well (multi-column sort tie-breaking, filter
  composition, selection across pagination boundaries, resize/reorder state) for a small
  team building many other things.
- **A full data-grid library** (AG Grid, MUI DataGrid) — more built-in (virtualization,
  Excel-like editing) but opinionated styling that would fight the existing design system,
  heavier bundle, and a license consideration for the paid tiers most of the "enterprise"
  feature set lives behind.
