'use client';

import { useCallback, useMemo } from 'react';
import { ParentSize } from '@visx/responsive';
import { scaleLinear, scalePoint } from '@visx/scale';
import { AreaClosed, LinePath, Line, Circle } from '@visx/shape';
import { Group } from '@visx/group';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { LinearGradient } from '@visx/gradient';
import { curveMonotoneX } from '@visx/curve';
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

export interface XYPlotProps<Row extends Record<string, unknown>> {
  data: Row[];
  xKey: keyof Row & string;
  series: ChartSeries[];
  height?: number;
  /** Draw a gradient area under each line (area chart) vs. bare lines (line chart). */
  fill?: boolean;
  labelFormatter?: (label: string | number) => string;
  valueFormatter?: (value: number) => string;
}

/** Shared line/area plot. `fill` toggles the gradient area. Crosshair + glass tooltip. */
export function XYPlot<Row extends Record<string, unknown>>(props: XYPlotProps<Row>) {
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
  fill = true,
  labelFormatter,
  valueFormatter,
}: XYPlotProps<Row> & { width: number; height: number }) {
  const innerW = Math.max(0, width - CHART_MARGIN.left - CHART_MARGIN.right);
  const innerH = Math.max(0, height - CHART_MARGIN.top - CHART_MARGIN.bottom);

  const categories = useMemo(() => data.map((d) => String(d[xKey])), [data, xKey]);
  const xScale = useMemo(
    () => scalePoint<string>({ domain: categories, range: [0, innerW], padding: 0.5 }),
    [categories, innerW],
  );
  const maxY = useMemo(
    () => max(data, (d) => max(series, (s) => Number(d[s.key]) || 0)) ?? 1,
    [data, series],
  );
  const yScale = useMemo(
    () => scaleLinear<number>({ domain: [0, maxY === 0 ? 1 : maxY * 1.1], range: [innerH, 0], nice: true }),
    [maxY, innerH],
  );

  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop, tooltipOpen } = useTooltip<{ index: number }>();

  const step = xScale.step();
  const handleMove = useCallback(
    (event: React.MouseEvent<SVGRectElement>) => {
      const point = localPoint(event);
      if (!point) return;
      const rel = point.x - CHART_MARGIN.left;
      const idx = Math.max(0, Math.min(data.length - 1, Math.round((rel - (xScale(categories[0] ?? '') ?? 0)) / step)));
      showTooltip({
        tooltipData: { index: idx },
        tooltipLeft: (xScale(categories[idx] ?? '') ?? 0) + CHART_MARGIN.left,
        tooltipTop: CHART_MARGIN.top,
      });
    },
    [data.length, xScale, categories, step, showTooltip],
  );

  const activeIdx = tooltipData?.index ?? -1;
  const activeCat = activeIdx >= 0 ? categories[activeIdx] ?? '' : '';
  const activeRow = activeIdx >= 0 ? data[activeIdx] : undefined;
  const activeX = xScale(activeCat) ?? 0;

  return (
    <div style={{ position: 'relative' }}>
      <svg width={width} height={height}>
        {series.map((s, i) => {
          const color = chartColor(s.colorIndex ?? i);
          return (
            <LinearGradient key={s.key} id={`xy-${s.key}`} from={color} to={color} fromOpacity={0.28} toOpacity={0.02} />
          );
        })}
        <Group left={CHART_MARGIN.left} top={CHART_MARGIN.top}>
          <GridRows scale={yScale} width={innerW} numTicks={4} stroke={AXIS_COLOR} strokeOpacity={0.4} strokeDasharray="3 3" />
          {series.map((s, i) => {
            const color = chartColor(s.colorIndex ?? i);
            const getX = (d: Row) => xScale(String(d[xKey])) ?? 0;
            const getY = (d: Row) => yScale(Number(d[s.key]) || 0);
            return (
              <Group key={s.key}>
                {fill && (
                  <AreaClosed
                    data={data}
                    x={getX}
                    y={getY}
                    yScale={yScale}
                    curve={curveMonotoneX}
                    fill={`url(#xy-${s.key})`}
                    stroke="transparent"
                  />
                )}
                <LinePath data={data} x={getX} y={getY} curve={curveMonotoneX} stroke={color} strokeWidth={2} />
              </Group>
            );
          })}

          {activeIdx >= 0 && activeRow && (
            <Group>
              <Line from={{ x: activeX, y: 0 }} to={{ x: activeX, y: innerH }} stroke={AXIS_COLOR} strokeWidth={1} />
              {series.map((s, i) => (
                <Circle
                  key={s.key}
                  cx={activeX}
                  cy={yScale(Number(activeRow[s.key]) || 0)}
                  r={4}
                  fill={chartColor(s.colorIndex ?? i)}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              ))}
            </Group>
          )}

          <AxisBottom
            top={innerH}
            scale={xScale}
            stroke={AXIS_COLOR}
            hideAxisLine
            hideTicks
            numTicks={Math.min(6, categories.length)}
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

          <rect
            width={innerW}
            height={innerH}
            fill="transparent"
            onMouseMove={handleMove}
            onMouseLeave={hideTooltip}
          />
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
