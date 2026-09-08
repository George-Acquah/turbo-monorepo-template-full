import { getCurrentUser } from '@workspace/context';
import type { DatabaseTx } from '@workspace/ports';
import type { Prisma } from '../../generated/prisma/index.js';
import type { PrismaService } from '../client/prisma.client';
import { resolvePrismaClient, type PrismaClientLike } from './prisma-client-resolver';

/**
 * Runs `fn` inside a Postgres transaction with `app.user_id` set via
 * `set_config(..., is_local => true)` as the first statement, so RLS
 * policies referencing `current_setting('app.user_id', true)` see the
 * calling request's actual user — see db-change-readiness's Chunk 10 for the
 * policies this feeds.
 *
 * WHY A TRANSACTION, NOT A PLAIN `SET`: this app's Postgres connection is
 * pooled (`@prisma/adapter-pg` wraps a node-postgres `Pool` —
 * `packages/server/infrastructure/databases/prisma/src/client/prisma.client.ts`).
 * A bare `SET app.user_id = …` persists for the whole physical connection,
 * which gets reused by a *different* request once returned to the pool —
 * that would leak one user's RLS context into another user's query. `SET
 * LOCAL` (what `set_config(..., true)` does) is scoped to the current
 * transaction only and is automatically cleared when it ends, which is
 * exactly the isolation this needs. This is the standard, documented
 * workaround for RLS + connection pooling with an ORM, not a bespoke
 * invention.
 *
 * SCOPE: this is for the bare, no-existing-`tx` case only — a single
 * adapter call made outside any explicit business transaction. When an
 * adapter method already received a `tx` (i.e. it's running inside a
 * caller-managed transaction opened via `TransactionPort`/`transactionPort
 * .execute(...)`), that transaction's RLS context was already set once,
 * centrally, by `PrismaTransactionAdapter` (`../providers/prisma.provider.ts`)
 * — do not call `withRlsContext` again in that case, just use
 * `resolvePrismaClient(tx, prisma)` as normal (or better, use
 * `withRlsAwareClient` below, which picks the right one for you). Calling
 * this a second time on an already-open transaction would attempt to open a
 * *new* top-level transaction from an already-transaction-scoped client,
 * which is not the same connection/transaction and would not compose
 * correctly — always branch on whether `tx` is present instead.
 *
 * Also sets `app.user_role` (from `UserContext.role`, a `SystemRoleKey` or
 * unset for ordinary members — see `packages/server/types/src/contracts/
 * user.interface.ts`) so policies can give staff a cross-user read/write
 * bypass. This is a defense-in-depth layer, not a replacement for the
 * existing `PermissionsGuard`/`@RequirePermission` checks at the endpoint —
 * those stay the first line of defense (confirmed sound by the Aug 9 audit);
 * RLS here is what still protects the data if an endpoint-level check is
 * ever missing or wrong, the same reasoning as the append-only audit-table
 * REVOKE lockdown already in this repo.
 *
 * @param prisma the injected PrismaService
 * @param fn callback receiving the transaction-scoped client — pass this,
 *   not `prisma`, to every repository call made inside it
 * @param overrides explicit `{ userId, profileId }` to use instead of
 *   `getCurrentUser()` (e.g. for worker jobs with no HTTP request context, or
 *   application code that already resolved the real identity/profile before
 *   any JWT/RequestContext exists — see `docs/infrastructure/runbooks/
 *   db-rls-policies.sql`'s v5 entry). Each key independently falls back to
 *   `getCurrentUser()`'s corresponding field (`userId` only — there is no
 *   ambient "current profile", so an absent `overrides.profileId` simply
 *   leaves `app.profile_id` unset). `null`/absent for a given key runs the
 *   transaction with that session variable unset — RLS policies must be
 *   written to fail closed (deny, not allow-all) for that case, never treat
 *   an unset session variable as "unrestricted."
 */
export async function withRlsContext<T>(
  prisma: PrismaService,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  overrides?: { userId?: string | null; profileId?: string | null },
): Promise<T> {
  const user = getCurrentUser();
  const effectiveUserId = overrides?.userId ?? user?.id ?? null;
  const effectiveProfileId = overrides?.profileId ?? null;
  const effectiveRole = overrides?.userId ? null : (user?.role ?? null);

  return prisma.$transaction(async (tx) => {
    if (effectiveUserId) {
      await tx.$executeRaw`SELECT set_config('app.user_id', ${effectiveUserId}, true)`;
    }
    if (effectiveProfileId) {
      await tx.$executeRaw`SELECT set_config('app.profile_id', ${effectiveProfileId}, true)`;
    }
    if (effectiveRole) {
      await tx.$executeRaw`SELECT set_config('app.user_role', ${effectiveRole}, true)`;
    }
    return fn(tx);
  });
}

/**
 * The per-adapter-method integration point: `PrismaTransactionAdapter`
 * (`../providers/prisma.provider.ts`) already sets the RLS session context
 * once, centrally, for every earks a specific session as revoked using the jti.xplicit `tx` an adapter method might receive —
 * so when `tx` is present, this just resolves it normally, no re-wrapping.
 * Only the bare, no-`tx` case (a single adapter call made outside any
 * explicit business transaction) needs `withRlsContext` to open one itself.
 *
 * Use this instead of `resolvePrismaClient` directly in any adapter method
 * for a table with RLS policies (see `docs/infrastructure/runbooks/
 * db-rls-policies.sql`):
 * ```ts
 * return withRlsAwareClient(tx, this.prisma, (client) =>
 *   client.userSession.create({ data: {...} }),
 * );
 * ```
 *
 * @param overrides explicit `{ userId, profileId }`, forwarded into
 *   `withRlsContext` only on the no-`tx` branch — when `tx` is already open,
 *   the transaction-level RLS context was already set once by
 *   `PrismaTransactionAdapter` (`../providers/prisma.provider.ts`), so an
 *   override here would be a no-op at best; call sites should thread
 *   overrides into the enclosing `transactionPort.execute(...)`/`.withTx(...)`
 *   call instead in that case.
 */
export function withRlsAwareClient<T>(
  tx: DatabaseTx | undefined,
  prisma: PrismaService,
  fn: (client: PrismaClientLike) => Promise<T>,
  overrides?: { userId?: string | null; profileId?: string | null },
): Promise<T> {
  if (tx) return fn(resolvePrismaClient(tx, prisma));
  return withRlsContext(prisma, fn, overrides);
}
