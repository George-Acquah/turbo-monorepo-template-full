'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@workspace/client-ui-primitives';
import { subscribeToNavigation } from '@/shared/lib/navigation-progress';

/**
 * Indeterminate top progress bar — the "we heard your click" acknowledgement.
 *
 * Starts on `beginNavigation()` (fired by TransitionLink / the command palette), jumps quickly
 * to ~85%, then crawls. It completes on `usePathname()` changing, which is the moment the new
 * route commits — with `loading.tsx` in place that's as soon as the skeleton paints, so the bar
 * finishing and the new page appearing are the same beat.
 *
 * The fast-then-crawl curve is the point, not decoration: most of the visible motion happens in
 * the first few hundred ms, so the app reads as fast even when the remainder takes a while. A
 * linear bar would advertise exactly how slow the request was.
 */
const FAST_ADVANCE_MS = 400;
const CRAWL_TICK_MS = 600;
const FAST_TARGET = 85;
const CRAWL_CEILING = 95;

export function NavigationProgressBar() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    return subscribeToNavigation(() => {
      clearTimers();
      setVisible(true);
      setProgress(8);
      // Next frame, so the 8% start actually paints before the CSS width transition to 85%
      // begins — set both in the same frame and the browser collapses them into one jump.
      timers.current.push(
        setTimeout(() => setProgress(FAST_TARGET), 16),
        ...Array.from({ length: 5 }, (_, i) =>
          setTimeout(
            () => setProgress((p) => Math.min(CRAWL_CEILING, p + 2)),
            FAST_ADVANCE_MS + CRAWL_TICK_MS * (i + 1),
          ),
        ),
      );
    });
  }, []);

  // Completion. Skipped on first mount (nothing was in flight) — `visible` is false then.
  useEffect(() => {
    if (!visible) return;
    clearTimers();
    setProgress(100);
    const hide = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);
    timers.current.push(hide);
    return () => clearTimeout(hide);
    // Deliberately keyed on pathname alone: this must run when the route commits, not when
    // `visible` flips (which would re-fire it on its own state change and never settle).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => clearTimers, []);

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5',
        !visible && 'opacity-0',
      )}
    >
      <div
        className={cn(
          'h-full bg-primary shadow-[0_0_8px_var(--primary)]',
          'transition-[width,opacity] duration-(--duration-base) ease-out motion-reduce:transition-none',
          progress === 100 && 'opacity-0',
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
