export type SortDirection = 'asc' | 'desc';

export interface Sort<T extends string = string> {
  field: T;
  direction?: SortDirection;
}
