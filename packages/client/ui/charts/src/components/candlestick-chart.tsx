'use client';

import { useMemo } from 'react';
import { ParentSize } from '@visx/responsive';
import { scaleBand, scaleLinear } from '@visx/scale';
import { Group } from '@visx/group';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { max, min } from 'd3-array';
import { CHART_UP, CHART_DOWN } from '../lib/palette';
import { AXIS_COLOR, CHART_MARGIN, axisBottomTickLabelProps, axisLeftTickLabelProps } from '../lib/axis';

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface CandlestickChartProps {
  data: Candle[];
  height?: number;
  labelFormatter?: (label: string) => string;
  valueFormatter?: (value: number) => string;
}

/**
 * OHLC candlestick — the signature financial chart. Up candles use the success tone, down
 * the destructive tone (color + the body direction both encode it). Ready for price-like
 * views; not used by the current admin dashboard.
 */
export function CandlestickChart(props: CandlestickChartProps) {
  const { height = 300 } = props;
  return (
    <div style={{ height, width: '100%' }}>
      <ParentSize>{({ width }) => (width < 2 ? null : <Inner {...props} width={width} height={height} />)}</ParentSize>
    </div>
  );
}

function Inner({ data, width, height, labelFormatter, valueFormatter }: CandlestickChartProps & { width: number; height: number }) {
  const innerW = Math.max(0, width - CHART_MARGIN.left - CHART_MARGIN.right);
  const innerH = Math.max(0, height - CHART_MARGIN.top - CHART_MARGIN.bottom);
  const categories = useMemo(() => data.map((d) => d.date), [data]);

  const xScale = useMemo(() => scaleBand<string>({ domain: categories, range: [0, innerW], padding: 0.3 }), [categories, innerW]);
  const lo = useMemo(() => min(data, (d) => d.low) ?? 0, [data]);
  const hi = useMemo(() => max(data, (d) => d.high) ?? 1, [data]);
  const yScale = useMemo(
    () => scaleLinear<number>({ domain: [lo * 0.98, hi * 1.02], range: [innerH, 0], nice: true }),
    [lo, hi, innerH],
  );
  const bodyW = Math.max(2, xScale.bandwidth());

  return (
    <svg width={width} height={height}>
      <Group left={CHART_MARGIN.left} top={CHART_MARGIN.top}>
        <GridRows scale={yScale} width={innerW} numTicks={5} stroke={AXIS_COLOR} strokeOpacity={0.4} strokeDasharray="3 3" />
        {data.map((c) => {
          const up = c.close >= c.open;
          const color = up ? CHART_UP : CHART_DOWN;
          const cx = (xScale(c.date) ?? 0) + bodyW / 2;
          const yOpen = yScale(c.open);
          const yClose = yScale(c.close);
          const bodyTop = Math.min(yOpen, yClose);
          const bodyH = Math.max(1, Math.abs(yClose - yOpen));
          return (
            <Group key={c.date}>
              <line x1={cx} x2={cx} y1={yScale(c.high)} y2={yScale(c.low)} stroke={color} strokeWidth={1} />
              <rect x={xScale(c.date) ?? 0} y={bodyTop} width={bodyW} height={bodyH} rx={1} fill={color} />
            </Group>
          );
        })}
        <AxisBottom
          top={innerH}
          scale={xScale}
          hideAxisLine
          hideTicks
          numTicks={Math.min(8, categories.length)}
          tickFormat={(v) => (labelFormatter ? labelFormatter(String(v)) : String(v))}
          tickLabelProps={axisBottomTickLabelProps}
        />
        <AxisLeft
          scale={yScale}
          numTicks={5}
          hideAxisLine
          hideTicks
          tickFormat={(v) => (valueFormatter ? valueFormatter(Number(v)) : String(v))}
          tickLabelProps={axisLeftTickLabelProps}
        />
      </Group>
    </svg>
  );
}
