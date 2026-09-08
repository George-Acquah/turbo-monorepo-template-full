export interface OffsetPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CursorPaginationMeta {
  limit: number;
  next?: string | null;
  prev?: string | null;
  hasNext: boolean;
}

export interface PaginationResult<T> {
  items: T[];
  meta: OffsetPaginationMeta | CursorPaginationMeta;
}
