import { cn } from '@workspace/client-ui-primitives';
import { Reveal } from '@/shared/lib/motion';

interface BentoGridProps {
  className?: string;
  children: React.ReactNode;
  /** @default true. Set false only if already nested inside another animated reveal. */
  reveal?: boolean;
}

/**
 * CSS-grid wrapper for editorial/bento-style compositions — varied tile sizes via
 * `BentoCell`'s `span`/`rowSpan`, instead of `SectionGrid`'s uniform tiles. Asymmetric
 * spans are `lg:`-only (see `BentoCell`); below `lg` this is a predictable 2-up stack.
 */
export function BentoGrid({ className, children, reveal = true }: BentoGridProps) {
  const gridClassName = cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className);
  return reveal ? (
    <Reveal className={gridClassName} delayStep={50}>
      {children}
    </Reveal>
  ) : (
    <div className={gridClassName}>{children}</div>
  );
}

interface BentoCellProps {
  span?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2;
  className?: string;
  children: React.ReactNode;
}

export function BentoCell({ span = 1, rowSpan = 1, className, children }: BentoCellProps) {
  return (
    <div
      className={cn(
        'col-span-2', // mobile/tablet: every cell is half-width, predictable 2-up stacking
        span === 1 && 'lg:col-span-1',
        span === 2 && 'lg:col-span-2',
        span === 3 && 'lg:col-span-3',
        span === 4 && 'lg:col-span-4',
        rowSpan === 2 && 'row-span-2',
        className,
      )}
    >
      {children}
    </div>
  );
}
