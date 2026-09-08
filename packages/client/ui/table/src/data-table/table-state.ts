import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnSizingState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';

export type Density = 'compact' | 'comfortable' | 'relaxed';

/**
 * Serializable slice of table state — the "saved view" extension point.
 * No saved-views backend exists yet (see
 * docs/client-foundation/package-roadmap.md), so this is a plain snapshot +
 * `onStateChange` callback rather than a built-in persistence layer; callers
 * decide where a view lives (localStorage, a URL query string, or a future
 * saved-views endpoint) and pass it back in via `initialState`/`state`.
 */
export interface TableState {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
  columnVisibility: VisibilityState;
  columnOrder: ColumnOrderState;
  columnSizing: ColumnSizingState;
  rowSelection: RowSelectionState;
  density: Density;
}

export const DEFAULT_TABLE_STATE: TableState = {
  sorting: [],
  columnFilters: [],
  globalFilter: '',
  columnVisibility: {},
  columnOrder: [],
  columnSizing: {},
  rowSelection: {},
  density: 'comfortable',
};
