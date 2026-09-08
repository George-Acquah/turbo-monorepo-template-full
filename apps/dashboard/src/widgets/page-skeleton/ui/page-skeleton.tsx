import { Skeleton } from '@workspace/client-ui-primitives';
import { Panel } from '@/widgets/panel';
import { SectionGrid } from '@/widgets/section-grid';

/**
 * Route-level skeleton parts, composed by the `loading.tsx` files.
 *
 * Every block here mirrors the real component's box model (same paddings, same type sizes, so
 * the same heights) — that's the whole job. A skeleton that's the wrong size trades a spinner
 * for a layout shift, which is worse: the user's eye settles on content that then jumps.
 * When you change PageHeader/StatTile/Panel, change these too.
 */

/** Matches `PageHeader` — h1 (text-xl) over an optional description line (text-sm). */
export function PageHeaderSkeleton({ withDescription = true }: { withDescription?: boolean }) {
  return (
    <div className="min-w-0 space-y-1">
      <Skeleton className="h-7 w-48" />
      {withDescription && <Skeleton className="h-5 w-80 max-w-full" />}
    </div>
  );
}

/** Matches `StatTile`'s default variant: label+icon row, value, optional hint. */
export function StatGridSkeleton({ count = 3, cols = 3 }: { count?: number; cols?: 2 | 3 | 4 }) {
  return (
    <SectionGrid cols={cols}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-xl p-4">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="size-4 rounded" />
          </div>
          <Skeleton className="mt-2 h-8 w-20" />
          <Skeleton className="mt-1 h-4 w-16" />
        </div>
      ))}
    </SectionGrid>
  );
}

/** Generic titled panel with body lines — the fallback shape for prose/detail content. */
export function PanelSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <section className={`glass rounded-xl ${className ?? ''}`}>
      <header className="px-4 pt-4">
        <Skeleton className="h-5 w-32" />
      </header>
      <div className="space-y-2 p-4 pt-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </section>
  );
}

/**
 * Matches members' list shape — stacked `glass rounded-xl p-4` rows (enrolment-list,
 * subscription-list, access grants), not a bordered table.
 */
export function RowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="glass flex items-center gap-3 rounded-xl p-4">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20 shrink-0 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** The common detail-page shape: back link + header, a stat row, then content panels. */
export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="min-w-0 space-y-1">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-7 w-64 max-w-full" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <StatGridSkeleton count={3} />
      <Panel>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </Panel>
    </div>
  );
}
