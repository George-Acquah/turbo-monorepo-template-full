import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { IdempotencyInterceptor } from './idempotency.interceptor';

export const IDEMPOTENT_SCOPE_META = 'idempotency:scope';

/**
 * Marks a route as accepting an `Idempotency-Key` request header (doc 02
 * "Idempotency (API side)"). `scope` namespaces the key so the same raw
 * value can't collide across unrelated endpoints — mirrors the
 * `IdempotencyKeyRepositoryPort`'s `(scope, key)` unique constraint.
 *
 * A shared `packages/server/*` package (not app-local, despite doc 11 §1
 * describing it that way) because a `modules/{context}` package needs to
 * apply this directly on its own controller methods, and packages must
 * never import from `apps/**` — same reasoning as `@workspace/permissions`
 * and `@workspace/profile-context`.
 *
 * Applying this decorator both tags the route (so `IdempotencyInterceptor`
 * knows to act) and attaches the interceptor — one decorator, not two.
 * Requests without the header proceed normally (opt-in on the client side,
 * per doc 02); requests with it get replay-on-retry semantics, and a
 * mismatched body under a reused key gets a 409.
 */
export const Idempotent = (scope: string) =>
  applyDecorators(SetMetadata(IDEMPOTENT_SCOPE_META, scope), UseInterceptors(IdempotencyInterceptor));
