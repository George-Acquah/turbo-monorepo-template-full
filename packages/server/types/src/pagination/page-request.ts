/** Offset-based pagination request */
export interface OffsetPaginationRequest {
  page: number; // 1-based
  limit: number;
}

/** Cursor-based pagination request */
export interface CursorPaginationRequest {
  limit: number;
  after?: string | null; // cursor token for next page
  before?: string | null; // cursor token for previous page
}

export type PageRequest = OffsetPaginationRequest | CursorPaginationRequest;

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 25;
