import { DatabaseTx } from './shared';

// ─────────────────────────────────────────────────────────────────────────────
// Magic TypeScript Utility (Strict, No `any`)
// ─────────────────────────────────────────────────────────────────────────────
type Unpacked<T> = T extends Array<infer U> ? U : T;

/**
 * Extracts top-level primitive fields AND 1-level deep relation fields.
 * Prevents traversing into standard classes like Date.
 */
export type EntitySelectPath<T> = {
  [K in keyof T & string]: NonNullable<T[K]> extends Date
    ? K
    : NonNullable<T[K]> extends object
      ? K | `${K}.${keyof NonNullable<Unpacked<T[K]>> & string}`
      : K;
}[keyof T & string];

// ─────────────────────────────────────────────────────────────────────────────
// Repository Query Options
// ─────────────────────────────────────────────────────────────────────────────
export interface RepoQueryOptions<P extends object, K extends keyof P = keyof P> {
  /**
   * The subset of fields to return.
   * * By combining K (top-level keys) with EntitySelectPath<P>, developers get
   * full IDE autocomplete for nested relations (e.g., 'settings.currency'),
   * WITHOUT breaking the existing `Pick<P, K>` return types in the adapters.
   */
  select?: readonly (K | EntitySelectPath<P>)[];

  /** Optional transaction context */
  tx?: DatabaseTx;
}
