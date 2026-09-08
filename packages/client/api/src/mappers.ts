import type { PaginatedResponse, PaginatedResponseMeta } from '@workspace/client-types';
import type { UnwrappedResult } from './client';

export function mapArray<TRaw, TMapped>(
  result: UnwrappedResult<TRaw[]>,
  mapper: (item: TRaw) => TMapped,
): TMapped[] {
  return (result.data ?? []).map(mapper);
}

/**
 * Normalizes an `unwrap()`ed list result into `PaginatedResponse<T>`. Reads pagination
 * fields from `result.meta.pagination` (populated by `HttpResponseEnvelopeInterceptor`
 * when a controller returns `PaginationResult<T>`) and falls back to treating the whole
 * array as a single page when a route doesn't paginate yet — most don't, today.
 */
export function mapPaginated<TRaw, TMapped>(
  result: UnwrappedResult<TRaw[]>,
  mapper?: (item: TRaw) => TMapped,
): PaginatedResponse<TMapped | TRaw> {
  const rawData = result.data ?? [];
  const paginationMeta = (result.meta?.pagination ?? {}) as Record<string, unknown>;

  const toPositiveNumber = (value: unknown, fallback: number) => {
    const next = Number(value);
    return Number.isFinite(next) && next > 0 ? next : fallback;
  };

  const toNumberAllowZero = (value: unknown, fallback: number) => {
    const next = Number(value);
    return Number.isFinite(next) && next >= 0 ? next : fallback;
  };

  const page = toPositiveNumber(paginationMeta.page, 1);
  const limit = toPositiveNumber(paginationMeta.limit, rawData.length || 20);
  const total = toNumberAllowZero(paginationMeta.total, rawData.length);
  const totalPages = toPositiveNumber(
    paginationMeta.totalPages,
    Math.max(1, Math.ceil(total / limit)),
  );

  const hasNext =
    typeof paginationMeta.hasNext === 'boolean' ? paginationMeta.hasNext : page < totalPages;
  const hasPrev = typeof paginationMeta.hasPrev === 'boolean' ? paginationMeta.hasPrev : page > 1;

  const meta: PaginatedResponseMeta = { page, limit, total, totalPages, hasNext, hasPrev };

  return {
    ...meta,
    data: mapper ? rawData.map(mapper) : rawData,
  };
}
