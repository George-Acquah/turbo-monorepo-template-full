'use client';
import NextLink from 'next/link';
import type { ComponentProps, MouseEvent } from 'react';
import { beginNavigation } from './navigation-progress';

/**
 * Drop-in replacement for `next/link`'s `Link` — same props, same rendered `<a>` — that pings
 * `NavigationProgressBar` on click so the bar starts moving the instant the user commits.
 *
 * It deliberately does NOT intercept the navigation: no `preventDefault`, no manual
 * `router.push`. An earlier version did both (to sequence a cross-fade) and that was the bug —
 * hijacking navigation meant losing `next/link`'s prefetching and scroll restoration, and it
 * kept the user parked on the old page until the new route's data fully resolved. The route
 * committing immediately, with `loading.tsx` painting a skeleton, is the whole point.
 *
 * Only fires on a plain left-click. Modifier-clicks (open in new tab, middle-click) and a
 * caller's own `onClick` calling `preventDefault()` fall through untouched — those either don't
 * navigate this document or shouldn't be signalled at all.
 */
export function Link({ href, onClick, ...props }: ComponentProps<typeof NextLink>) {
  return (
    <NextLink
      href={href}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }
        beginNavigation();
      }}
      {...props}
    />
  );
}
