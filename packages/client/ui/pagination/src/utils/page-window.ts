export type PageWindowItem = number | '...';

/**
 * Returns the page numbers (and '...' ellipsis fillers) to render around
 * `current`, out of `total` pages — always shows page 1 and the last page,
 * plus a `current-1..current+1` window. Framework-agnostic so both the
 * Next.js `Pagination` component and any future non-Next consumer share one
 * implementation.
 */
export function getPageWindow(current: number, total: number): PageWindowItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: PageWindowItem[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}
