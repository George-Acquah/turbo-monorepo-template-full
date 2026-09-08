// Presentational primitives
export * from './components/table';

// Data table
export { DataTable } from './data-table/data-table';
export type { DataTableProps } from './data-table/data-table';
export { useDataTable } from './data-table/use-data-table';
export type { UseDataTableOptions, UseDataTableResult } from './data-table/use-data-table';
export {
  createSelectionColumn,
  createActionsColumn,
  StatusChip,
  PersonCell,
  DateTimeCell,
  StatusSelect,
  SELECTION_COLUMN_ID,
  ACTIONS_COLUMN_ID,
} from './data-table/columns';
export type {
  RowAction,
  StatusChipProps,
  PersonCellProps,
  DateTimeCellProps,
  StatusSelectProps,
  StatusSelectOption,
} from './data-table/columns';
export type { TableState, Density } from './data-table/table-state';
export { DEFAULT_TABLE_STATE } from './data-table/table-state';
export { VirtualizedBody, VirtualizedHeader, renderVirtualCell } from './data-table/virtualized-body';

// Re-export the tanstack primitives consumers need for typing their own
// column defs, so they don't need a direct @tanstack/react-table dependency
// just to write `ColumnDef<MyRow>`.
export type {
  ColumnDef,
  Row,
  Table as TanstackTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
} from '@tanstack/react-table';
