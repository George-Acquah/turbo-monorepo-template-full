import type { DatabasePagination } from '@workspace/ports';

// Storage-agnostic — {skip, take} is common to virtually any paged store, not
// just Prisma. Every persistence package's query layer can reuse this instead
// of redefining it.
export interface SkipTakeBounds {
  /** Applied when the caller supplied no `take` at all. */
  defaultTake?: number;
  /** Hard ceiling. A larger requested `take` is clamped down to this. */
  maxTake?: number;
}

/**
 * `bounds` is how an HTTP-facing query refuses to return an entire table.
 *
 * Without it, an absent `take` means "no LIMIT" and Prisma returns every row —
 * which is how `GET /v1/audit/logs` with no query params became both a
 * cross-account PII dump and an OOM vector on a 1GB container. Validation
 * decorators on the DTO are necessary but not sufficient: they only cover the
 * paths that actually have a DTO, and the Swagger annotation there advertised
 * `maximum: 100` while no `@Max` validator existed. Clamping here makes the
 * bound a property of the query layer instead of a property of remembering.
 *
 * Deliberately opt-in: internal sweepers legitimately read unbounded sets and
 * pass no bounds, so defaulting a limit globally would silently truncate them.
 */
export function toSkipTake(
  pagination?: DatabasePagination,
  bounds?: SkipTakeBounds,
): { skip?: number; take?: number } {
  const { skip, take } = pagination ?? {};

  let effectiveTake = take ?? bounds?.defaultTake;
  if (effectiveTake != null && bounds?.maxTake != null) {
    effectiveTake = Math.min(effectiveTake, bounds.maxTake);
  }

  return {
    ...(skip != null ? { skip } : {}),
    ...(effectiveTake != null ? { take: effectiveTake } : {}),
  };
}
