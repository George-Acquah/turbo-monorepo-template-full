import { PageHeaderSkeleton, RowsSkeleton } from '@/widgets/page-skeleton';

/**
 * Default route-level skeleton for every `(dashboard)` route without its own `loading.tsx`.
 *
 * This file existing is what makes navigation feel instant: it gives the segment a Suspense
 * boundary, so the router commits the new route and paints this immediately instead of holding
 * the user on the previous page until the RSC payload resolves. The shell (sidebar, topbar,
 * progress bar) is in the layout above and never unmounts — only this region swaps.
 */
export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <RowsSkeleton rows={5} />
    </div>
  );
}
