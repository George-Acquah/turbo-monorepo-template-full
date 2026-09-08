# @workspace/client-ui-pagination

One `usePagination` hook, two strategies, matching the two server-side pagination
contracts in `packages/server/types/src/pagination/*` (`OffsetPaginationRequest`/`Meta` vs
`CursorPaginationRequest`/`Meta`, mirrored client-side as `PaginatedResponseMeta` /
`CursorPaginationMeta` in `@workspace/client-types`). Switch strategies by changing one
`strategy` prop — no duplicated APIs.

```ts
import { usePagination } from '@workspace/client-ui-pagination';

// Page-number
const paged = usePagination({ strategy: 'page', meta: response.meta });
// paged: { page, totalPages, total, limit, hasNext, hasPrev, pageWindow }

// Infinite scroll
const infinite = usePagination({
  strategy: 'infinite',
  hasNext: response.meta.hasNext,
  isLoading,
  onLoadMore: () => fetchNextPage(response.meta.next),
});
// infinite: { hasNext, isLoading, loadMore, sentinelRef }
```

`strategy` must stay stable for a given call site — it dispatches to a different
underlying hook per strategy internally, so flipping it at runtime breaks React's rules of
hooks (same constraint as any strategy-branching hook).

## Components

- **`<Pagination meta={...} />`** — page-number UI wired to Next.js App Router
  (`usePathname`/`useSearchParams`), builds `?page=N` links preserving other query params.
  Renders nothing if there's only one page.
- **`<InfiniteScrollTrigger pagination={infinite} />`** — sentinel for the infinite
  strategy; place at the end of your list. Auto-triggers `onLoadMore` via
  `IntersectionObserver` as it scrolls into view (`disableAutoTrigger: true` on the hook to
  drive it from a "Load more" button instead — call `pagination.loadMore()` directly and
  skip this component).

Both are optional — the hook is fully headless. A future non-Next context (or the
backoffice app, if it doesn't route pagination through the URL) can build its own UI
against the same hook.

## Composing with `@workspace/client-ui-table`

`DataTable` takes a `footer` slot for exactly this:

```tsx
<DataTable data={rows} columns={columns} footer={<Pagination meta={data.meta} />} />
```

## What this doesn't own

Data fetching and the accumulated item list, for the infinite strategy — this hook only
answers "should I load more, and when." Fetch in `onLoadMore`, append to your own state (or
a query library's cache), and pass the updated `hasNext`/`isLoading` back in on the next
render.

## Known gap

No backend endpoint returns either `PaginationResult<T>` shape live yet — every current
list endpoint returns a bare array. `Pagination`/`usePagination({strategy:'page'})` are
correct for the shape `mapPaginated` (`@workspace/client-api`) already produces defensively
today (treating a bare array as one full page); the cursor/infinite strategy is ready for
when a real cursor-paginated endpoint exists.
