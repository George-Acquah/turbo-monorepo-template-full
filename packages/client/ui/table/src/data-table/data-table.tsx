'use client';

import * as React from 'react';
import { flexRender, type ColumnDef, type Row } from '@tanstack/react-table';
import { AlertTriangle, Rows3, Search, SlidersHorizontal } from 'lucide-react';
import {
  Skeleton,
  buttonVariants,
  Button,
} from '@workspace/client-ui-primitives';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/client-ui-overlays';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@workspace/client-ui-forms';
import { usePagination, InfiniteScrollTrigger } from '@workspace/client-ui-pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/table';
import { cn } from '../utils/cn';
import { useDataTable, type UseDataTableOptions } from './use-data-table';
import { createSelectionColumn, createActionsColumn, type RowAction } from './columns';
import { VirtualizedHeader, VirtualizedBody, renderVirtualCell } from './virtualized-body';
import type { Density, TableState } from './table-state';

const DENSITY_ROW_CLASSNAME: Record<Density, string> = {
  compact: 'h-9 [&_[data-slot=table-cell]]:py-1 [&_[data-slot=table-head]]:h-9',
  comfortable: '',
  relaxed: 'h-14 [&_[data-slot=table-cell]]:py-4 [&_[data-slot=table-head]]:h-13',
};

const DENSITY_OPTIONS: { value: Density; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'relaxed', label: 'Relaxed' },
];

export interface DataTableProps<TData>
  extends Pick<
    UseDataTableOptions<TData>,
    | 'getRowId'
    | 'enableGrouping'
    | 'enableExpanding'
    | 'getSubRows'
    | 'manualPagination'
    | 'manualSorting'
    | 'manualFiltering'
    | 'rowCount'
    | 'initialState'
    | 'state'
    | 'onStateChange'
  > {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];

  /** Adds a checkbox column and enables row selection. */
  enableRowSelection?: boolean;
  /** Adds a trailing action-menu column. */
  actions?: RowAction<TData>[];

  /** Global search input in the toolbar. */
  searchPlaceholder?: string;
  /** Hide the global search input (e.g. when filtering happens elsewhere). */
  hideSearch?: boolean;
  /** Extra controls rendered at the end of the toolbar (e.g. a "New" button). */
  toolbarActions?: React.ReactNode;
  /** Rendered in place of the toolbar while `enableRowSelection` has any row selected. */
  bulkActions?: (selectedRows: TData[]) => React.ReactNode;
  /** Hide the built-in toolbar entirely (search/column-visibility/density/toolbarActions). */
  hideToolbar?: boolean;

  isLoading?: boolean;
  skeletonRowCount?: number;
  isError?: boolean;
  errorMessage?: string;
  emptyState?: React.ReactNode;

  stickyHeader?: boolean;
  className?: string;
  /** Composes with `@workspace/client-ui-pagination` — render a `<Pagination>` here. */
  footer?: React.ReactNode;

  /**
   * Stages the reveal of already-fetched rows instead of mounting all of them at once —
   * an `InfiniteScrollTrigger` sentinel appends another `pageSize` rows as it scrolls into
   * view. This is DOM-rendering staging over `data` that's already in memory, not a new
   * network request per scroll (the backend list endpoints don't support pagination params
   * yet — see apps/backoffice/README.md's "Backend gaps"). Resets to the first page
   * whenever the search/sort/filter state changes so a new query doesn't strand a large
   * accumulated count.
   */
  infiniteScroll?: boolean;
  /** @default 50 */
  pageSize?: number;

  /**
   * Opt in for large datasets (hundreds+ rows) — see `VirtualizedBody`'s
   * docstring for the accessibility trade-off this makes (table layout
   * switches to flex/grid so only visible rows mount).
   */
  virtualized?: boolean;
  estimateRowHeight?: number;
  virtualizedMaxHeight?: number | string;
}

export function DataTable<TData>(props: DataTableProps<TData>) {
  const {
    data,
    columns: userColumns,
    getRowId,
    enableRowSelection = false,
    enableGrouping,
    enableExpanding,
    getSubRows,
    manualPagination,
    manualSorting,
    manualFiltering,
    rowCount,
    initialState,
    state,
    onStateChange,
    actions,
    searchPlaceholder = 'Search...',
    hideSearch = false,
    toolbarActions,
    bulkActions,
    hideToolbar = false,
    isLoading = false,
    skeletonRowCount = 8,
    isError = false,
    errorMessage = 'Something went wrong loading this data.',
    emptyState,
    stickyHeader = true,
    className,
    footer,
    infiniteScroll = false,
    pageSize = 50,
    virtualized = false,
    estimateRowHeight = 40,
    virtualizedMaxHeight = 480,
  } = props;

  const columns = React.useMemo<ColumnDef<TData, unknown>[]>(() => {
    const withSelection = enableRowSelection
      ? [createSelectionColumn<TData>(), ...userColumns]
      : userColumns;
    return actions && actions.length > 0
      ? [...withSelection, createActionsColumn<TData>(actions)]
      : withSelection;
  }, [userColumns, enableRowSelection, actions]);

  const { table, density, setDensity } = useDataTable<TData>({
    data,
    columns,
    getRowId,
    enableRowSelection,
    enableGrouping,
    enableExpanding,
    getSubRows,
    manualPagination,
    manualSorting,
    manualFiltering,
    rowCount,
    initialState,
    state,
    onStateChange: onStateChange as ((state: TableState) => void) | undefined,
  });

  const selectedRows = table.getSelectedRowModel().rows.map((row: Row<TData>) => row.original);
  const showBulkBar = enableRowSelection && selectedRows.length > 0 && bulkActions;
  const allRows = table.getRowModel().rows;
  const columnCount = table.getAllLeafColumns().length;

  const globalFilterValue = table.getState().globalFilter as string | undefined;
  const [visibleCount, setVisibleCount] = React.useState(pageSize);
  React.useEffect(() => {
    setVisibleCount(pageSize);
  }, [globalFilterValue, pageSize]);

  const rows = infiniteScroll ? allRows.slice(0, visibleCount) : allRows;
  const infinitePagination = usePagination({
    strategy: 'infinite',
    hasNext: infiniteScroll && visibleCount < allRows.length,
    onLoadMore: () => setVisibleCount((count) => count + pageSize),
  });

  return (
    <div className={cn('flex flex-col gap-3', className)} data-density={density}>
      {!hideToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {showBulkBar ? (
            <div className="flex items-center gap-2 text-sm text-foreground">
              <span className="font-medium">{selectedRows.length} selected</span>
              {bulkActions(selectedRows)}
              <Button
                variant="ghost"
                size="xs"
                onClick={() => table.resetRowSelection()}
              >
                Clear
              </Button>
            </div>
          ) : (
            <>
              {hideSearch ? (
                <div />
              ) : (
                <InputGroup className="max-w-xs">
                  <InputGroupAddon>
                    <Search className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder={searchPlaceholder}
                    value={(table.getState().globalFilter as string | undefined) ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      table.setGlobalFilter(e.target.value)
                    }
                  />
                </InputGroup>
              )}

              <div className="flex items-center gap-1.5">
                <DensityMenu density={density} onDensityChange={setDensity} />
                <ColumnVisibilityMenu table={table} />
                {toolbarActions}
              </div>
            </>
          )}
        </div>
      )}

      {virtualized && !isLoading && !isError && rows.length > 0 ? (
        <div className="flex flex-col overflow-hidden rounded-xl border border-border">
          <VirtualizedHeader headerGroups={table.getHeaderGroups()} />
          <VirtualizedBody
            rows={rows}
            estimateRowHeight={estimateRowHeight}
            maxHeight={virtualizedMaxHeight}
            columnCount={columnCount}
            renderCell={renderVirtualCell}
          />
        </div>
      ) : (
      <Table>
        <TableHeader className={cn(stickyHeader && 'sticky top-0 z-10')}>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className={DENSITY_ROW_CLASSNAME[density]}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  className="relative"
                  aria-sort={
                    header.column.getIsSorted() === 'asc'
                      ? 'ascending'
                      : header.column.getIsSorted() === 'desc'
                        ? 'descending'
                        : 'none'
                  }
                >
                  {header.isPlaceholder ? null : (
                    <button
                      type="button"
                      disabled={!header.column.getCanSort()}
                      onClick={header.column.getToggleSortingHandler()}
                      className={cn(
                        'inline-flex items-center gap-1',
                        header.column.getCanSort() && 'cursor-pointer select-none',
                      )}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc'
                        ? ' ↑'
                        : header.column.getIsSorted() === 'desc'
                          ? ' ↓'
                          : null}
                    </button>
                  )}
                  {header.column.getCanResize() && (
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className="absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none hover:bg-ring/50"
                    />
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
              <TableRow key={`skeleton-${rowIndex}`} className={DENSITY_ROW_CLASSNAME[density]}>
                {Array.from({ length: columnCount }).map((__, colIndex) => (
                  <TableCell key={`skeleton-cell-${colIndex}`}>
                    <Skeleton className="h-4 w-full max-w-32" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={columnCount} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <AlertTriangle className="size-5 text-destructive" />
                  <p className="text-sm">{errorMessage}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnCount} className="h-32 text-center">
                {emptyState ?? (
                  <p className="text-sm text-muted-foreground">No results.</p>
                )}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
                className={DENSITY_ROW_CLASSNAME[density]}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      )}

      {infiniteScroll && !isLoading && !isError && <InfiniteScrollTrigger pagination={infinitePagination} />}

      {footer}
    </div>
  );
}

function DensityMenu({
  density,
  onDensityChange,
}: {
  density: Density;
  onDensityChange: (density: Density) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: 'outline', size: 'icon-xs' }))}
        aria-label="Row density"
      >
        <Rows3 className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* GroupLabel throws (Base UI) outside a Group and takes the popup down with it. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>Density</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {DENSITY_OPTIONS.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={density === option.value}
            onCheckedChange={() => onDensityChange(option.value)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ColumnVisibilityMenu<TData>({
  table,
}: {
  table: ReturnType<typeof useDataTable<TData>>['table'];
}) {
  const hideableColumns = table.getAllLeafColumns().filter((column) => column.getCanHide());
  if (hideableColumns.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: 'outline', size: 'icon-xs' }))}
        aria-label="Toggle columns"
      >
        <SlidersHorizontal className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Columns</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {hideableColumns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(!!value)}
          >
            {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
