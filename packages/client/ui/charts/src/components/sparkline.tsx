'use client';

import { ParentSize } from '@visx/responsive';
import { scaleLinear } from '@visx/scale';
import { AreaClosed, LinePath } from '@visx/shape';
import { LinearGradient } from '@visx/gradient';
import { curveMonotoneX } from '@visx/curve';
import { max, min } from 'd3-array';
import { chartColor } from '../lib/palette';

export interface SparklineProps {
  /** Bare series of numbers, oldest→newest. */
  data: number[];
  /** Categorical color index (fixed order). @default 0 */
  colorIndex?: number;
  height?: number;
  className?: string;
}

/**
 * Tiny inline trend for a KPI tile — no axes, grid, or tooltip. A 2px line over a faint
 * gradient wash; the tile's number carries the value, this carries the shape. visx-drawn.
 */
export function Sparkline({ data, colorIndex = 0, height = 36, className }: SparklineProps) {
  const color = chartColor(colorIndex);
  const gradientId = `spark-grad-${colorIndex}`;

  return (
    <div className={className} style={{ height }}>
      <ParentSize>
        {({ width }) => {
          if (width < 2 || data.length === 0) return null;
          const lo = min(data) ?? 0;
          const hi = max(data) ?? 1;
          const x = scaleLinear({ domain: [0, Math.max(1, data.length - 1)], range: [1, width - 1] });
          const y = scaleLinear({ domain: [lo, hi === lo ? lo + 1 : hi], range: [height - 2, 2] });
          const getX = (_: number, i: number) => x(i);
          const getY = (d: number) => y(d);

          return (
            <svg width={width} height={height}>
              <LinearGradient id={gradientId} from={color} to={color} fromOpacity={0.28} toOpacity={0} />
              <AreaClosed
                data={data}
                x={getX}
                y={getY}
                yScale={y}
                curve={curveMonotoneX}
                fill={`url(#${gradientId})`}
                stroke="transparent"
              />
              <LinePath data={data} x={getX} y={getY} curve={curveMonotoneX} stroke={color} strokeWidth={2} />
            </svg>
          );
        }}
      </ParentSize>
    </div>
  );
}
