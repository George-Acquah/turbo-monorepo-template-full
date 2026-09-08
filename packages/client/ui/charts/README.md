# @workspace/client-ui-charts

Tokened, theme-aware chart components for the dashboard apps (`apps/backoffice`,
`apps/members`), built on [recharts]. Shipped as raw source and consumed via Next
`transpilePackages` — the app must also add an `@source` line for it in its `globals.css`
so Tailwind v4 scans the package (see the `workspace-dashboard-ui` skill, trap 1).

## Rules baked in (from the `dataviz` skill)

- Colors come from the theme's `--chart-1..8` and status tokens — **never a raw literal**.
  Categorical hues are assigned in **fixed order, never cycled** (`chartColor(i)`); a 9th
  series folds into "Other".
- Status hues (`good`/`warning`/`critical`/`neutral`) are reserved and never reused as a
  categorical "series N"; they always ship with a label, not color alone.
- 2px lines, gradient area fills, 4px rounded bar ends, thin recessive tokened axes/grid,
  crosshair/hover tooltip. Figures are `font-mono tabular-nums`.

## Components

`Sparkline`, `AreaChart`, `LineChart`, `BarChart`, `StatusDonut`, `CandlestickChart`,
`ActivityHeatmap`, `ChartTooltipContent`.
Helpers: `chartColor`, `compactNumber`, `compactMoneyMinor`, `shortDate`.

`CandlestickChart` is OHLC/market-price-shaped — do not use it in `apps/members`, whose
platform is education/mentorship, not a broker or signal service; using it there would
visually imply live trading data.

`ActivityHeatmap` is a GitHub-contributions-style daily-count grid (pure CSS grid, no
visx — the layout is a fixed calendar, not a continuous scale). Takes a gap-free
`{ date, count }[]` series; the caller owns fetching/shaping that data.

[recharts]: https://recharts.org
