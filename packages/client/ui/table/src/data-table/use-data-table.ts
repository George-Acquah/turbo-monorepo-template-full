'use client';

import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
  type ColumnOrderState,
  type ColumnSizingState,
  type GroupingState,
  type ExpandedState,
  type Table as TanstackTable,
} from '@tanstack/react-table';
import { DEFAULT_TABLE_STATE, type TableState, type Density } from './table-state';

export interface UseDataTableOptions<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  /**
   * Stable row id — defaults to the tanstack default (array index) if
   * omitted. Pass this for any table with selection, expansion, or a saved
   * view: index-based ids break as soon as `data` reorders or paginates.
   */
  getRowId?: (row: TData, index: number) => string;
  enableRowSelection?: boolean;
  enableMultiRowSelection?: boolean;
  enableGrouping?: boolean;
  enableExpanding?: boolean;
  getSubRows?: (row: TData) => TData[] | undefined;
  /**
   * Server-side pagination/sorting/filtering — when true (the default,
   * matching this repo's list endpoints returning one page at a time), this
   * hook trusts `data` is already the right slice instead of re-deriving
   * row models client-side. Set to `false` for a small, fully-client-side
   * dataset.
   */
  manualPagination?: boolean;
  manualSorting?: boolean;
  manualFiltering?: boolean;
  rowCount?: number;
  initialState?: Partial<TableState>;
  /** Controlled state — pass to snap the table onto a loaded saved view. */
  state?: Partial<TableState>;
  onStateChange?: (state: TableState) => void;
}

export interface UseDataTableResult<TData> {
  table: TanstackTable<TData>;
  state: TableState;
  density: Density;
  setDensity: (density: Density) => void;
}

export function useDataTable<TData>(
  options: UseDataTableOptions<TData>,
): UseDataTableResult<TData> {
  const {
    data,
    columns,
    getRowId,
    enableRowSelection = false,
    enableMultiRowSelection = true,
    enableGrouping = false,
    enableExpanding = false,
    getSubRows,
    manualPagination = true,
    manualSorting = false,
    manualFiltering = false,
    rowCount,
    initialState,
    state: controlledState,
    onStateChange,
  } = options;

  const [sorting, setSorting] = React.useState<SortingState>(
    initialState?.sorting ?? DEFAULT_TABLE_STATE.sorting,
  );
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    initialState?.columnFilters ?? DEFAULT_TABLE_STATE.columnFilters,
  );
  const [globalFilter, setGlobalFilter] = React.useState<string>(
    initialState?.globalFilter ?? DEFAULT_TABLE_STATE.globalFilter,
  );
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    initialState?.columnVisibility ?? DEFAULT_TABLE_STATE.columnVisibility,
  );
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(
    initialState?.columnOrder ?? DEFAULT_TABLE_STATE.columnOrder,
  );
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>(
    initialState?.columnSizing ?? DEFAULT_TABLE_STATE.columnSizing,
  );
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    initialState?.rowSelection ?? DEFAULT_TABLE_STATE.rowSelection,
  );
  const [grouping, setGrouping] = React.useState<GroupingState>([]);
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [density, setDensity] = React.useState<Density>(
    initialState?.density ?? DEFAULT_TABLE_STATE.density,
  );

  const resolvedSorting = controlledState?.sorting ?? sorting;
  const resolvedColumnFilters = controlledState?.columnFilters ?? columnFilters;
  const resolvedGlobalFilter = controlledState?.globalFilter ?? globalFilter;
  const resolvedColumnVisibility = controlledState?.columnVisibility ?? columnVisibility;
  const resolvedColumnOrder = controlledState?.columnOrder ?? columnOrder;
  const resolvedColumnSizing = controlledState?.columnSizing ?? columnSizing;
  const resolvedRowSelection = controlledState?.rowSelection ?? rowSelection;
  const resolvedDensity = controlledState?.density ?? density;

  const resolvedState = React.useMemo<TableState>(
    () => ({
      sorting: resolvedSorting,
      columnFilters: resolvedColumnFilters,
      globalFilter: resolvedGlobalFilter,
      columnVisibility: resolvedColumnVisibility,
      columnOrder: resolvedColumnOrder,
      columnSizing: resolvedColumnSizing,
      rowSelection: resolvedRowSelection,
      density: resolvedDensity,
    }),
    [
      resolvedSorting,
      resolvedColumnFilters,
      resolvedGlobalFilter,
      resolvedColumnVisibility,
      resolvedColumnOrder,
      resolvedColumnSizing,
      resolvedRowSelection,
      resolvedDensity,
    ],
  );

  React.useEffect(() => {
    onStateChange?.(resolvedState);
  }, [resolvedState, onStateChange]);

  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: {
      sorting: resolvedSorting,
      columnFilters: resolvedColumnFilters,
      globalFilter: resolvedGlobalFilter,
      columnVisibility: resolvedColumnVisibility,
      columnOrder: resolvedColumnOrder,
      columnSizing: resolvedColumnSizing,
      rowSelection: resolvedRowSelection,
      grouping,
      expanded,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onRowSelectionChange: setRowSelection,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    enableRowSelection,
    enableMultiRowSelection,
    enableGrouping,
    enableExpanding: enableExpanding || Boolean(getSubRows),
    getSubRows,
    manualPagination,
    manualSorting,
    manualFiltering,
    rowCount,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    ...(manualSorting ? {} : { getSortedRowModel: getSortedRowModel() }),
    ...(manualFiltering ? {} : { getFilteredRowModel: getFilteredRowModel() }),
    ...(enableExpanding || getSubRows ? { getExpandedRowModel: getExpandedRowModel() } : {}),
    ...(enableGrouping ? { getGroupedRowModel: getGroupedRowModel() } : {}),
  });

  return { table, state: resolvedState, density: resolvedDensity, setDensity };
}
