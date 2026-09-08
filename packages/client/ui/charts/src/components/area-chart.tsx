'use client';

import { XYPlot, type XYPlotProps } from './xy-plot';

export type AreaChartProps<Row extends Record<string, unknown>> = Omit<XYPlotProps<Row>, 'fill'>;

/** Gradient area chart — the dashboard's primary "over-time" form. 2px line over a fading fill. */
export function AreaChart<Row extends Record<string, unknown>>(props: AreaChartProps<Row>) {
  return <XYPlot {...props} fill />;
}
