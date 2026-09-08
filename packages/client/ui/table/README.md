# @workspace/client-ui-table

The foundation for every data-heavy screen in `apps/members` and the future
`apps/backoffice`. Two layers:

- **Presentational primitives** (`Table`, `TableHeader`, `TableBody`, `TableRow`,
  `TableHead`, `TableCell`, `TableFooter`, `TableCaption`) — thin styled wrappers around
  native HTML table elements. Unchanged from before this pass; use these directly for a
  static table with no sorting/filtering/selection.
- **`DataTable`** — the composable, headless-engine-backed data table. Built on
  [`@tanstack/react-table`](https://tanstack.com/table) (the industry-standard headless
  table engine — see `docs/client-foundation/decisions/adr-0001-table-engine.md`), with
  the presentational primitives above as its render layer.

## Quick start

```tsx
import { DataTable, StatusChip, type ColumnDef } from '@workspace/client-ui-table';

interface Programme {
  id: string;
  name: string;
  kind: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

const columns: ColumnDef<Programme, unknown>[] = [
  { accessorKey: 'name', header: 'Programme' },
  { accessorKey: 'kind', header: 'Kind' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <StatusChip
        label={row.original.status}
        tone={row.original.status === 'PUBLISHED' ? 'success' : 'default'}
      />
    ),
  },
];

<DataTable
  data={programmes}
  columns={columns}
  getRowId={(row) => row.id}
  enableRowSelection
  actions={[
    { label: 'Publish', onSelect: (row) => publish(row.id) },
    { label: 'Archive', onSelect: (row) => archive(row.id), variant: 'destructive', separated: true },
  ]}
  bulkActions={(rows) => (
    <Button size="xs" onClick={() => bulkArchive(rows.map((r) => r.id))}>
      Archive {rows.length}
    </Button>
  )}
  isLoading={isLoading}
  isError={isError}
  footer={<Pagination meta={data.meta} />} {/* from @workspace/client-ui-pagination */}
/>;
```

## What's built in

- **Sorting, column filtering, global search** — native `@tanstack/react-table` state,
  wired through `useDataTable`.
- **Column visibility, ordering, resizing** — native tanstack features; visibility exposed
  via the toolbar's column menu, resizing via a drag handle on each header.
- **Row selection + bulk actions** — `enableRowSelection` injects a checkbox column;
  `bulkActions` swaps the toolbar for a selection bar while any row is selected.
- **Row actions** — `actions` injects a trailing action-menu column
  (`@workspace/client-ui-overlays`'s `DropdownMenu`).
- **Expandable / grouped rows** — `getSubRows` for tree data, `enableGrouping` for
  tanstack's native grouping.
- **Density modes** — `compact` / `comfortable` / `relaxed`, toggled from the toolbar or
  controlled via `state.density`; also sets `data-density` so `@workspace/client-theme`'s
  `--density-scale` token cascades to anything else reading it.
- **Loading / error / empty states** — `isLoading` (skeleton rows via
  `@workspace/client-ui-primitives`'s `Skeleton`), `isError` + `errorMessage`, and
  `emptyState`.
- **Sticky header** — on by default (`stickyHeader`).
- **Cell renderers** — `StatusChip` (lifecycle/status badges) and `PersonCell`
  (avatar + name, the common "who" column) ship as ready-made `cell` renderers.
- **Virtualization** — opt-in via `virtualized` for large datasets (hundreds+ rows). See
  `VirtualizedBody`'s docstring for the accessibility trade-off it makes (table layout
  switches to flex/grid so only visible rows mount) — reserve it for genuinely large
  tables, not the default.

## What's a documented extension point, not a built-in

- **Pagination** — deliberately not baked in. Compose `@workspace/client-ui-pagination` via
  the `footer` slot (page-number) or its infinite-scroll strategy (see that package's
  README) so `DataTable` doesn't hard-depend on one pagination strategy.
- **Saved views** — no backend feature for it yet. `useDataTable`'s `state`/`onStateChange`
  give you a serializable `TableState` snapshot; persist it wherever makes sense
  (localStorage, a URL query string, or a future saved-views endpoint) and pass it back in
  via `initialState`.

## Server-side data

`manualPagination`/`manualSorting`/`manualFiltering` default to `true`/`false`/`false` —
matching this repo's list endpoints, which return one page at a time (`manualPagination:
true` means `DataTable` trusts `data` is already the right page rather than re-slicing
client-side). Flip `manualSorting`/`manualFiltering` on once an endpoint accepts
`sort`/filter query params, and read `state.sorting`/`state.columnFilters` to build the
request.
