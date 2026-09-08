import { cn } from '@workspace/client-ui-primitives';

/**
 * Responsive dashboard grid. `cols` is the count at the widest breakpoint;
 * it steps down to 2 on tablet and 1 on mobile so nothing ever overflows.
 */
export function SectionGrid({
  cols = 3,
  className,
  children,
}: {
  cols?: 2 | 3 | 4;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 sm:grid-cols-2',
        cols === 3 && 'lg:grid-cols-3',
        cols === 4 && 'lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  );
}
