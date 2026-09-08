'use client';

/**
 * "A navigation just started" signal, published on link click and consumed by
 * `NavigationProgressBar`.
 *
 * There is deliberately no `end`/`complete` counterpart: completion is derived from
 * `usePathname()` changing, which is the moment the new route actually commits. An explicit
 * end-signal would have to be fired by whoever *thinks* navigation finished, and every version
 * of that we tried fired at the wrong moment — that mistiming is exactly what made the old
 * opacity fade look broken.
 *
 * This does not hold, delay, or wrap the navigation itself. `next/link` navigates natively;
 * `loading.tsx` is what puts the new route's skeleton on screen immediately. This is purely a
 * notification so the progress bar can start moving on click.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export function beginNavigation(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeToNavigation(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
