'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';
import type { PaginatedResponseMeta } from '@workspace/client-types';
import { buttonVariants } from '@workspace/client-ui-primitives';
import { usePagination } from '../hooks/use-pagination';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@workspace/client-ui-forms';

interface PaginationProps {
  meta: PaginatedResponseMeta;
  limitOptions?: number[];
}

const DEFAULT_LIMIT_OPTIONS = [10, 25, 50, 100];

/** Page-number pagination wired to Next.js App Router — builds `?page=N` links preserving
 * other query params. For infinite scroll, use `InfiniteScrollTrigger` instead. */
export function Pagination({ meta, limitOptions = DEFAULT_LIMIT_OPTIONS }: PaginationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { page, limit, totalPages, total, hasNext, hasPrev, pageWindow } = usePagination({
    strategy: 'page',
    meta,
  });

  if (totalPages <= 1) return null;

  function buildHref(targetPage: number, targetLimit: number = limit) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(targetPage));
    params.set('limit', String(targetLimit));

    return `${pathname}?${params.toString()}`;
  }

  /**
   * Changing the number of records per page always starts
   * from page 1.
   */
  function handleLimitChange(value: unknown) {
    if (value === null) return;

    const nextLimit = Number(value);

    if (!Number.isFinite(nextLimit) || nextLimit <= 0 || nextLimit === limit) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    params.set('page', '1');
    params.set('limit', String(nextLimit));

    router.push(`${pathname}?${params.toString()}`);
  }

  const hasLimitOptions = limitOptions.length > 1;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-2 pt-4">
      {/* Summary + limit */}
      <div className="flex items-center gap-3">
        <p className="text-xs text-muted-foreground">
          <span className="hidden sm:inline">
            Page {page} of {totalPages}
            <span className="ml-1.5">({total} total)</span>
          </span>

          <span className="sm:hidden">{total} total</span>
        </p>

        {hasLimitOptions && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="whitespace-nowrap">Rows per page</span>
            <Select value={String(limit)} onValueChange={handleLimitChange}>
              <SelectTrigger
                size="sm"
                aria-label="Rows per page"
                className="w-[72px] border-border/50 bg-background text-xs"
              >
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {limitOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-1 mx-auto sm:mx-0">
        {hasPrev ? (
          <Link
            href={buildHref(page - 1)}
            aria-label="Previous page"
            className={cn(buttonVariants({ variant: 'outline', size: 'icon-xs' }))}
          >
            <ChevronLeft className="size-3.5" />
          </Link>
        ) : (
          <span
            aria-disabled
            className={cn(
              buttonVariants({ variant: 'outline', size: 'icon-xs' }),
              'pointer-events-none opacity-50',
            )}
          >
            <ChevronLeft className="size-3.5" />
          </span>
        )}

        {pageWindow.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground select-none">
              ...
            </span>
          ) : p === page ? (
            <span key={p} className={cn(buttonVariants({ variant: 'default', size: 'icon-xs' }))}>
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={buildHref(p)}
              className={cn(buttonVariants({ variant: 'outline', size: 'icon-xs' }))}
            >
              {p}
            </Link>
          ),
        )}

        {hasNext ? (
          <Link
            href={buildHref(page + 1)}
            aria-label="Next page"
            className={cn(buttonVariants({ variant: 'outline', size: 'icon-xs' }))}
          >
            <ChevronRight className="size-3.5" />
          </Link>
        ) : (
          <span
            aria-disabled
            className={cn(
              buttonVariants({ variant: 'outline', size: 'icon-xs' }),
              'pointer-events-none opacity-50',
            )}
          >
            <ChevronRight className="size-3.5" />
          </span>
        )}
      </div>
    </nav>
  );
}
