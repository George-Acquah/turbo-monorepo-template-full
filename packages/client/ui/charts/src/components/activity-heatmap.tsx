'use client';

export interface ActivityHeatmapDay {
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  /** Count of qualifying events on this day (e.g. lessons completed). */
  count: number;
}

export interface ActivityHeatmapProps {
  /**
   * One entry per day, chronological (oldest → newest), typically a contiguous range
   * (e.g. the trailing ~30 days). Missing days in the middle of the range are treated as
   * a gap in the grid rather than being inferred — pass a complete, gap-free series.
   */
  data: ActivityHeatmapDay[];
  /** Size of each day cell in px. @default 12 */
  cellSize?: number;
  className?: string;
}

/** 0 = no activity; 4 = highest bucket. Fixed thresholds, not scaled to the data's own max —
 * keeps a single day's intensity comparable across renders instead of shifting per dataset. */
function bucket(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

// Reserved "activity level" scale, not a categorical series — success token at increasing
// opacity steps. Never a raw hex/oklch literal.
const BUCKET_CLASS = ['bg-surface-2', 'bg-success/25', 'bg-success/50', 'bg-success/75', 'bg-success'] as const;

/** Sunday-start weeks, oldest week first; each week is a column of up to 7 day cells
 * (`null` pads the first/last week so every column is exactly 7 rows). */
function buildWeeks(data: ActivityHeatmapDay[]): (ActivityHeatmapDay | null)[][] {
  const first = data[0];
  if (!first) return [];
  const firstDow = new Date(`${first.date}T00:00:00Z`).getUTCDay();
  const padded: (ActivityHeatmapDay | null)[] = [...Array<null>(firstDow).fill(null), ...data];
  while (padded.length % 7 !== 0) padded.push(null);

  const weeks: (ActivityHeatmapDay | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));
  return weeks;
}

function dayLabel(day: ActivityHeatmapDay): string {
  const formatted = new Date(`${day.date}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
  return `${day.count} ${day.count === 1 ? 'entry' : 'entries'} on ${formatted}`;
}

/**
 * GitHub-contributions-style dot/heatmap grid of daily activity counts — a per-day count of
 * some domain event (lesson completions, logins, ...), rendered as weeks-of-7 columns.
 * Pure CSS grid, no visx: the grid is a fixed calendar layout, not a continuous scale, so
 * there's no axis/scale for visx to earn its keep here.
 */
export function ActivityHeatmap({ data, cellSize = 12, className }: ActivityHeatmapProps) {
  const weeks = buildWeeks(data);
  if (weeks.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex gap-[3px] overflow-x-auto pb-1" role="img" aria-label="Daily activity heatmap">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-rows-7 gap-[3px]">
            {week.map((day, dayIndex) =>
              day ? (
                <div
                  key={day.date}
                  title={dayLabel(day)}
                  aria-label={dayLabel(day)}
                  className={cellClass(bucket(day.count))}
                  style={{ width: cellSize, height: cellSize }}
                />
              ) : (
                <div key={dayIndex} aria-hidden style={{ width: cellSize, height: cellSize }} />
              ),
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-xs text-muted-foreground">
        <span>Less</span>
        {BUCKET_CLASS.map((c, i) => (
          <span key={i} aria-hidden className={`${c} rounded-[3px]`} style={{ width: cellSize, height: cellSize }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

function cellClass(level: 0 | 1 | 2 | 3 | 4): string {
  return `${BUCKET_CLASS[level]} rounded-[3px]`;
}
