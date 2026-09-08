'use client';

import { XYPlot, type XYPlotProps } from './xy-plot';

export type LineChartProps<Row extends Record<string, unknown>> = Omit<XYPlotProps<Row>, 'fill'>;

/** Multi-series line chart — change over time without the area fill. */
export function LineChart<Row extends Record<string, unknown>>(props: LineChartProps<Row>) {
  return <XYPlot {...props} fill={false} />;
}
