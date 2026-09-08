import { SortField } from './sort';

export interface SearchOptions {
  query?: string;
  filters?: Record<string, unknown>;
  sort?: SortField[];
  limit?: number;
  offset?: number;
}
