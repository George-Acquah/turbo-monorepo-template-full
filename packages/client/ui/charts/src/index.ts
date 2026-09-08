// Tokened, theme-aware chart components for the Workspace dashboard apps. Built on visx
// (financial/"trading" language, à la Bklit); colors come from the theme's `--chart-*`/
// status tokens (never a raw literal). All are client components — mount them as
// `'use client'` leaves inside RSC page compositions.

export { Sparkline, type SparklineProps } from './components/sparkline';
export { ActivityHeatmap, type ActivityHeatmapProps, type ActivityHeatmapDay } from './components/activity-heatmap';
export { AreaChart, type AreaChartProps } from './components/area-chart';
export { LineChart, type LineChartProps } from './components/line-chart';
export { BarChart, type BarChartProps } from './components/bar-chart';
export { StatusDonut, type StatusDonutProps, type DonutSlice } from './components/status-donut';
export { CandlestickChart, type CandlestickChartProps, type Candle } from './components/candlestick-chart';
export { GlassTooltip, type ChartTooltipConfig, type TooltipRow } from './components/chart-tooltip';

export { chartColor, CHART_SERIES, STATUS_COLOR, CHART_UP, CHART_DOWN, type StatusTone } from './lib/palette';
export type { ChartSeries } from './lib/axis';
export { compactNumber, compactMoneyMinor, shortDate } from './lib/format';
