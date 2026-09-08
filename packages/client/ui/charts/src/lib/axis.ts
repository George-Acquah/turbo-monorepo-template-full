/** Shared visx axis/grid styling — thin, recessive, tokened (dataviz: axes recede). */
export const AXIS_COLOR = 'var(--border)';
export const TICK_LABEL_COLOR = 'var(--muted-foreground)';

export const axisBottomTickLabelProps = () =>
  ({ fill: TICK_LABEL_COLOR, fontSize: 11, textAnchor: 'middle' as const, dy: '0.25em' });

export const axisLeftTickLabelProps = () =>
  ({ fill: TICK_LABEL_COLOR, fontSize: 11, textAnchor: 'end' as const, dx: '-0.25em', dy: '0.25em' });

export interface ChartSeries {
  /** Field on each row. */
  key: string;
  /** Legend/tooltip label. */
  label: string;
  /** Fixed categorical index. Defaults to the series' position. */
  colorIndex?: number;
}

/** Standard inner margins for an axed chart. */
export const CHART_MARGIN = { top: 8, right: 12, bottom: 24, left: 44 } as const;
