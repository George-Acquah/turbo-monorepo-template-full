import { ArrowDownRight, ArrowRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@workspace/client-ui-primitives';
import { Sparkline } from '@workspace/client-ui-charts';
import { Link } from '@/shared/lib/transition-link';
import { CountUp } from '@/shared/lib/motion';

interface StatTileProps {
  label: string;
  /** A number renders as an animated `CountUp`; a string renders as-is. */
  value: string | number;
  /**
   * Appended after `value` when it's a number, e.g. `valueSuffix="%"` → "68%". A plain
   * string, not a formatter function —`StatTile` is a Server Component that renders the
   * Client Component `CountUp`, and functions can't cross that boundary.
   */
  valueSuffix?: string;
  /**
   * `hero`: the one emphasized tile in a bento composition — larger type, spotlight
   * glow, deeper shadow. Use on at most one tile per screen (see `tile-spotlight` in
   * tokens.css).
   */
  variant?: 'default' | 'hero';
  /** Signed change, e.g. "+12%". Tone is derived from `direction`, never colour alone. */
  delta?: string;
  direction?: 'up' | 'down';
  hint?: string;
  icon?: LucideIcon;
  /** When set, the tile becomes a link with a hover affordance. Use only where there's one
   * obvious destination list page for this metric — not on every tile. */
  href?: string;
  /**
   * Trailing trend line, oldest→newest. Only pass this when a real historical series backs
   * the metric — do not derive it from a single current-value read. As of writing, no
   * dashboard metric has a backend-supplied history (see `StatsSection` in
   * `views/dashboard/ui/dashboard-page.tsx`), so this stays unused there until one exists.
   */
  sparklineData?: number[];
}

/**
 * KPI tile. Figures use `font-mono` tabular numerals so values line up in a row.
 * Direction is conveyed by an arrow icon *and* colour — never colour alone
 * (accessibility: don't rely on colour to carry meaning).
 */
export function StatTile({
  label,
  value,
  valueSuffix,
  variant = 'default',
  delta,
  direction,
  hint,
  icon: Icon,
  href,
  sparklineData,
}: StatTileProps) {
  const DeltaIcon = direction === 'down' ? ArrowDownRight : ArrowUpRight;
  const isHero = variant === 'hero';

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className={cn('min-w-0 font-medium text-muted-foreground', isHero ? 'text-sm' : 'text-xs')}>
          {label}
        </span>
        {Icon && (
          <Icon aria-hidden className={cn('shrink-0 text-muted-foreground', isHero ? 'size-5' : 'size-4')} />
        )}
      </div>

      <div className={cn('flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1', isHero ? 'mt-4' : 'mt-3')}>
        {typeof value === 'number' ? (
          <CountUp
            value={value}
            suffix={valueSuffix}
            className={cn(
              'min-w-0 font-mono font-semibold tabular-nums text-foreground',
              isHero ? 'text-4xl' : 'text-2xl',
            )}
          />
        ) : (
          <span
            className={cn(
              'min-w-0 wrap-break-word font-mono font-semibold tabular-nums text-foreground',
              isHero ? 'text-4xl' : 'text-2xl',
            )}
          >
            {value}
          </span>
        )}
        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium',
              direction === 'down' ? 'text-destructive' : 'text-success',
            )}
          >
            <DeltaIcon aria-hidden className="size-3" />
            {delta}
          </span>
        )}
      </div>

      {hint && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{hint}</p>}

      {sparklineData && sparklineData.length > 1 && (
        <Sparkline data={sparklineData} height={isHero ? 40 : 28} className="mt-3" />
      )}

      {href && (
        <ArrowRight
          aria-hidden
          className="absolute right-3 bottom-3 z-10 size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        />
      )}
    </>
  );

  const className = cn(
    'glass relative flex min-h-32 flex-col overflow-hidden rounded-xl p-4',
    isHero && 'tile-spotlight min-h-64 justify-center rounded-2xl p-6 shadow-elevation-3',
    href && 'group transition-colors hover:border-ring/30',
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}
