'use client';

import * as React from 'react';
import type { PaginatedResponseMeta } from '@workspace/client-types';
import { getPageWindow, type PageWindowItem } from '../utils/page-window';

// ============================================================================
// Page-number strategy — derives display state from a fetched page's meta.
// No internal state: the caller already owns "what page am I on" (a URL
// query param, a client-side page index, ...) and re-fetches/re-renders with
// a new `meta` when it changes. This hook just normalizes that meta into
// what a page-number UI needs (including the page window), once.
// ============================================================================
export interface UsePagePaginationOptions {
  strategy: 'page';
  meta: PaginatedResponseMeta;
}

export interface UsePagePaginationResult {
  strategy: 'page';
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  pageWindow: PageWindowItem[];
}

function usePagePagination({ meta }: UsePagePaginationOptions): UsePagePaginationResult {
  return React.useMemo(() => {
    const totalPages = meta.totalPages ?? Math.max(1, Math.ceil(meta.total / meta.limit));
    return {
      strategy: 'page' as const,
      page: meta.page,
      totalPages,
      total: meta.total,
      limit: meta.limit,
      hasNext: meta.hasNext,
      hasPrev: meta.hasPrev,
      pageWindow: getPageWindow(meta.page, totalPages),
    };
  }, [meta.page, meta.total, meta.limit, meta.totalPages, meta.hasNext, meta.hasPrev]);
}

// ============================================================================
// Infinite-scroll strategy — cursor-driven. Doesn't own fetching or the
// accumulated item list (that's app/query-library territory); it owns the
// "should I load more, and when" concern: a manual `loadMore()` for a
// "Load more" button, and an IntersectionObserver-driven auto-trigger via
// `sentinelRef` for true infinite scroll. Derive `hasNext` from a
// `CursorPaginationMeta.hasNext` (or `OffsetPaginationMeta.hasNext` if an
// endpoint is offset-paged but the UI still wants to append-on-scroll).
// ============================================================================
export interface UseInfinitePaginationOptions {
  strategy: 'infinite';
  hasNext: boolean;
  isLoading?: boolean;
  onLoadMore: () => void;
  /** Skip the IntersectionObserver auto-trigger — call `loadMore()` yourself (e.g. a button). */
  disableAutoTrigger?: boolean;
  /** How far before the sentinel enters the viewport to trigger a load. @default '200px' */
  rootMargin?: string;
}

export interface UseInfinitePaginationResult {
  strategy: 'infinite';
  hasNext: boolean;
  isLoading: boolean;
  loadMore: () => void;
  /** Attach to a sentinel element at the end of the list. */
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

function useInfinitePagination({
  hasNext,
  isLoading = false,
  onLoadMore,
  disableAutoTrigger = false,
  rootMargin = '200px',
}: UseInfinitePaginationOptions): UseInfinitePaginationResult {
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = React.useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  const loadMore = React.useCallback(() => {
    if (hasNext && !isLoading) onLoadMoreRef.current();
  }, [hasNext, isLoading]);

  React.useEffect(() => {
    if (disableAutoTrigger || !hasNext) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [disableAutoTrigger, hasNext, rootMargin, loadMore]);

  return { strategy: 'infinite' as const, hasNext, isLoading, loadMore, sentinelRef };
}

// ============================================================================
// Unified entry point
// ============================================================================
export type UsePaginationOptions = UsePagePaginationOptions | UseInfinitePaginationOptions;
export type UsePaginationResult = UsePagePaginationResult | UseInfinitePaginationResult;

/**
 * One hook, two strategies — switch with minimal effort by changing
 * `strategy` and its accompanying option.
 *
 * `strategy` must stay stable for a given call site (don't flip it at
 * runtime): this dispatches to a different underlying hook per strategy, so
 * changing it mid-lifetime breaks React's rules of hooks — the same
 * constraint any strategy-branching hook has.
 */
export function usePagination(options: UsePagePaginationOptions): UsePagePaginationResult;
export function usePagination(options: UseInfinitePaginationOptions): UseInfinitePaginationResult;
export function usePagination(options: UsePaginationOptions): UsePaginationResult {
  if (options.strategy === 'page') {
    return usePagePagination(options);
  }
  return useInfinitePagination(options);
}
