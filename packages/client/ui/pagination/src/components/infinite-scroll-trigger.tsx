'use client';

import type { UseInfinitePaginationResult } from '../hooks/use-pagination';

interface InfiniteScrollTriggerProps {
  pagination: UseInfinitePaginationResult;
  loadingIndicator?: React.ReactNode;
  /** Rendered once `hasNext` is false — e.g. "You're all caught up." Omit for nothing. */
  endMessage?: React.ReactNode;
  className?: string;
}

/**
 * Sentinel element for `usePagination({ strategy: 'infinite' })` — place it at the end of
 * your list. It observes itself and calls `onLoadMore` as it scrolls into view (unless
 * `disableAutoTrigger` was set, in which case wire a "Load more" button to
 * `pagination.loadMore()` instead and this component is unnecessary).
 */
export function InfiniteScrollTrigger({
  pagination,
  loadingIndicator,
  endMessage,
  className,
}: InfiniteScrollTriggerProps) {
  if (!pagination.hasNext) {
    return endMessage ? (
      <div className="py-4 text-center text-xs text-muted-foreground">{endMessage}</div>
    ) : null;
  }

  return (
    <div ref={pagination.sentinelRef} className={className ?? 'flex items-center justify-center py-4'}>
      {pagination.isLoading
        ? (loadingIndicator ?? <span className="text-xs text-muted-foreground">Loading more…</span>)
        : null}
    </div>
  );
}
