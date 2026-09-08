import { cn } from '@workspace/client-ui-primitives';

const SIZE = 88;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Progress ring. An SVG rather than a CSS `conic-gradient` because only the stroke approach
 * gives rounded caps and a clean track underneath — and it animates the dash offset for free.
 *
 * Server-renderable (no client directive): the fill transition runs on mount from CSS, so
 * there's no need to drag this into the client bundle.
 */
export function CompletenessRing({ percent, className }: { percent: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);
  const complete = clamped === 100;

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-hidden
        // -90° so the arc starts at 12 o'clock instead of 3 o'clock.
        className="-rotate-90"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-surface-2"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={cn(
            'transition-[stroke-dashoffset] duration-(--duration-slow) ease-out motion-reduce:transition-none',
            complete ? 'stroke-success' : 'stroke-primary',
          )}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
          {clamped}
          <span className="text-xs text-muted-foreground">%</span>
        </span>
      </div>
    </div>
  );
}
