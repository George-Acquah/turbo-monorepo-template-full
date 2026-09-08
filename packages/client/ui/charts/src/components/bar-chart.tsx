'use client';

import { useCallback, useMemo } from 'react';
import { ParentSize } from '@visx/responsive';
import { scaleBand, scaleLinear } from '@visx/scale';
import { Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { localPoint } from '@visx/event';
import { useTooltip, TooltipWithBounds } from '@visx/tooltip';
import { max } from 'd3-array';
import { chartColor } from '../lib/palette';
import {
  AXIS_COLOR,
  CHART_MARGIN,
  axisBottomTickLabelProps,
  axisLeftTickLabelProps,
  type ChartSeries,
} from '../lib/axis';
import { GlassTooltip, TOOLTIP_STYLE } from './chart-tooltip';

export interface BarChartProps<Row extends Record<string, unknown>> {
  data: Row[];
  xKey: keyof Row & string;
  series: ChartSeries[];
  height?: number;
  labelFormatter?: (label: string | number) => string;
  valueFormatter?: (value: number) => string;
}

/** Grouped bar chart — magnitude by category. Rounded data-ends anchored to the baseline. */
export function BarChart<Row extends Record<string, unknown>>(props: BarChartProps<Row>) {
  const { height = 260 } = props;
  return (
    <div style={{ height, width: '100%' }}>
      <ParentSize>{({ width }) => (width < 2 ? null : <Inner {...props} width={width} height={height} />)}</ParentSize>
    </div>
  );
}

function Inner<Row extends Record<string, unknown>>({
  data,
  xKey,
  series,
  width,
  height,
  labelFormatter,
  valueFormatter,
}: BarChartProps<Row> & { width: number; height: number }) {
  const innerW = Math.max(0, width - CHART_MARGIN.left - CHART_MARGIN.right);
  const innerH = Math.max(0, height - CHART_MARGIN.top - CHART_MARGIN.bottom);
  const categories = useMemo(() => data.map((d) => String(d[xKey])), [data, xKey]);

  const xScale = useMemo(
    () => scaleBand<string>({ domain: categories, range: [0, innerW], padding: 0.3 }),
    [categories, innerW],
  );
  const groupScale = useMemo(
    () => scaleBand<string>({ domain: series.map((s) => s.key), range: [0, xScale.bandwidth()], padding: 0.1 }),
    [series, xScale],
  );
  const maxY = useMemo(() => max(data, (d) => max(series, (s) => Number(d[s.key]) || 0)) ?? 1, [data, series]);
  const yScale = useMemo(
    () => scaleLinear<number>({ domain: [0, maxY === 0 ? 1 : maxY * 1.1], range: [innerH, 0], nice: true }),
    [maxY, innerH],
  );

  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop, tooltipOpen } = useTooltip<{ index: number }>();

  const handleMove = useCallback(
    (event: React.MouseEvent<SVGRectElement>) => {
      const point = localPoint(event);
      if (!point) return;
      const rel = point.x - CHART_MARGIN.left;
      const idx = Math.max(0, Math.min(data.length - 1, Math.floor(rel / xScale.step())));
      showTooltip({
        tooltipData: { index: idx },
        tooltipLeft: (xScale(categories[idx] ?? '') ?? 0) + xScale.bandwidth() / 2 + CHART_MARGIN.left,
        tooltipTop: CHART_MARGIN.top,
      });
    },
    [data.length, xScale, categories, showTooltip],
  );

  const activeIdx = tooltipData?.index ?? -1;
  const activeCat = activeIdx >= 0 ? categories[activeIdx] ?? '' : '';
  const activeRow = activeIdx >= 0 ? data[activeIdx] : undefined;
  const barW = Math.max(2, groupScale.bandwidth());
  const radius = Math.min(4, barW / 2);

  return (
    <div style={{ position: 'relative' }}>
      <svg width={width} height={height}>
        <Group left={CHART_MARGIN.left} top={CHART_MARGIN.top}>
          <GridRows scale={yScale} width={innerW} numTicks={4} stroke={AXIS_COLOR} strokeOpacity={0.4} strokeDasharray="3 3" />
          {data.map((row, idx) => {
            const groupX = xScale(categories[idx] ?? '') ?? 0;
            const isActive = idx === activeIdx;
            return (
              <Group key={idx} left={groupX}>
                {series.map((s, i) => {
                  const color = chartColor(s.colorIndex ?? i);
                  const value = Number(row[s.key]) || 0;
                  const barH = innerH - yScale(value);
                  return (
                    <Bar
                      key={s.key}
                      x={groupScale(s.key) ?? 0}
                      y={yScale(value)}
                      width={barW}
                      height={Math.max(0, barH)}
                      rx={radius}
                      fill={color}
                      fillOpacity={isActive ? 1 : 0.85}
                    />
                  );
                })}
              </Group>
            );
          })}

          <AxisBottom
            top={innerH}
            scale={xScale}
            stroke={AXIS_COLOR}
            hideAxisLine
            hideTicks
            numTicks={Math.min(8, categories.length)}
            tickFormat={(v) => (labelFormatter ? labelFormatter(String(v)) : String(v))}
            tickLabelProps={axisBottomTickLabelProps}
          />
          <AxisLeft
            scale={yScale}
            numTicks={4}
            hideAxisLine
            hideTicks
            tickFormat={(v) => (valueFormatter ? valueFormatter(Number(v)) : String(v))}
            tickLabelProps={axisLeftTickLabelProps}
          />

          <rect width={innerW} height={innerH} fill="transparent" onMouseMove={handleMove} onMouseLeave={hideTooltip} />
        </Group>
      </svg>

      {tooltipOpen && activeRow && (
        <TooltipWithBounds key={activeIdx} left={tooltipLeft} top={tooltipTop} style={TOOLTIP_STYLE}>
          <GlassTooltip
            title={labelFormatter ? labelFormatter(activeCat) : activeCat}
            rows={series.map((s, i) => ({
              label: s.label,
              color: chartColor(s.colorIndex ?? i),
              value: valueFormatter
                ? valueFormatter(Number(activeRow[s.key]) || 0)
                : String(Number(activeRow[s.key]) || 0),
            }))}
          />
        </TooltipWithBounds>
      )}
    </div>
  );
}
