'use client';

import { ParentSize } from '@visx/responsive';
import { Group } from '@visx/group';
import { Pie } from '@visx/shape';
import { chartColor, STATUS_COLOR, type StatusTone } from '../lib/palette';

export interface DonutSlice {
  label: string;
  value: number;
  /** Reserved status tone — takes precedence over the categorical hue. */
  tone?: StatusTone;
}

export interface StatusDonutProps {
  data: DonutSlice[];
  height?: number;
  /** Big number in the hole. Defaults to the summed total. */
  centerLabel?: string;
  centerHint?: string;
}

/** Donut for a status/identity breakdown (visx Pie). Legend beside it — identity never color-alone. */
export function StatusDonut({ data, height = 200, centerLabel, centerHint }: StatusDonutProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const color = (d: DonutSlice, i: number) => (d.tone ? STATUS_COLOR[d.tone] : chartColor(i));

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ParentSize>
          {({ width }) => {
            if (width < 2) return null;
            const radius = Math.min(width, height) / 2;
            return (
              <svg width={width} height={height}>
                <Group top={height / 2} left={width / 2}>
                  <Pie
                    data={data}
                    pieValue={(d) => d.value}
                    outerRadius={radius}
                    innerRadius={radius * 0.66}
                    padAngle={0.03}
                    startAngle={0}
                    endAngle={Math.PI * 2}
                  >
                    {(pie) =>
                      pie.arcs.map((arc, i) => {
                        const path = pie.path(arc);
                        return path ? <path key={arc.data.label} d={path} fill={color(arc.data, i)} /> : null;
                      })
                    }
                  </Pie>
                </Group>
              </svg>
            );
          }}
        </ParentSize>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">
            {centerLabel ?? total.toLocaleString('en-GB')}
          </span>
          {centerHint && <span className="text-xs text-muted-foreground">{centerHint}</span>}
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <span aria-hidden className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: color(d, i) }} />
              <span className="truncate">{d.label}</span>
            </span>
            <span className="font-mono tabular-nums font-medium text-foreground">{d.value.toLocaleString('en-GB')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
