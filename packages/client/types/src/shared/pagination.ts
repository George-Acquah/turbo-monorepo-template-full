/**
 * Mirrors the offset side of `packages/server/types/src/pagination/page-response.ts`'s
 * `OffsetPaginationMeta`. Populated at `envelope.meta.pagination` when a controller
 * returns `PaginationResult<T>` for a `page`/`limit`-style list endpoint.
 */
export interface OffsetPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** `data` unwrapped alongside its `OffsetPaginationMeta`, as consumed by `mapPaginated`. */
export interface PaginatedResponse<T> extends OffsetPaginationMeta {
  data: T[];
}

/** Back-compat alias — the shape most existing callers (Pagination UI, mappers) import. */
export type PaginatedResponseMeta = OffsetPaginationMeta;

/**
 * Mirrors the cursor side of `packages/server/types/src/pagination/page-response.ts`'s
 * `CursorPaginationMeta`. No live endpoint returns this shape yet (see
 * docs/client-foundation/package-roadmap.md) — defined now so the pagination package's
 * `infinite` strategy has a real contract to target.
 */
export interface CursorPaginationMeta {
  limit: number;
  next?: string | null;
  prev?: string | null;
  hasNext: boolean;
}

export interface CursorPaginatedResponse<T> extends CursorPaginationMeta {
  data: T[];
}
