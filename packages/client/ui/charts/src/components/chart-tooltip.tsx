'use client';

/** One row inside the glass tooltip. */
export interface TooltipRow {
  label: string;
  value: string;
  color?: string;
}

export interface ChartTooltipConfig {
  labelFormatter?: (label: string | number) => string;
  valueFormatter?: (value: number, name: string) => string;
}

/**
 * Glass tooltip body for the visx charts. Values use `font-mono tabular-nums`; a colored
 * chip carries series identity beside text-token ink (color never carries meaning alone).
 * Rendered inside `@visx/tooltip`'s `TooltipWithBounds` by each chart.
 */
export function GlassTooltip({ title, rows }: { title?: string; rows: TooltipRow[] }) {
  return (
    <div className="glass-strong min-w-32 rounded-lg px-3 py-2 text-xs shadow-elevation-2">
      {title && <p className="mb-1.5 font-medium text-muted-foreground">{title}</p>}
      <ul className="space-y-1">
        {rows.map((r, i) => (
          <li key={`${r.label}-${i}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-foreground">
              {r.color && (
                <span aria-hidden className="size-2 shrink-0 rounded-[3px]" style={{ backgroundColor: r.color }} />
              )}
              {r.label}
            </span>
            <span className="font-mono tabular-nums font-medium text-foreground">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Shared floating-tooltip style: transparent so our `.glass-strong` body shows through. */
export const TOOLTIP_STYLE = {
  position: 'absolute' as const,
  pointerEvents: 'none' as const,
  background: 'transparent',
  border: 'none',
  boxShadow: 'none',
  padding: 0,
};
