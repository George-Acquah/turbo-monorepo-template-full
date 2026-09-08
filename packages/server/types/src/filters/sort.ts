import type { SortDirection } from '../pagination/sort';

export interface SortField {
  field: string;
  direction?: SortDirection;
}
