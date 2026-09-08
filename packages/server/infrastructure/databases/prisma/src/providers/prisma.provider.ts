import { Inject, Injectable } from '@nestjs/common';
import { TransactionPort } from '@workspace/ports';
import { getCurrentUser } from '@workspace/context';
import type { Prisma } from '../../generated/prisma/index.js';
import { PrismaService } from '../client/prisma.client';
import { PRISMA_CLIENT_TOKEN } from '../client/prisma.tokens';

/**
 * Sets `app.user_id`/`app.profile_id`/`app.user_role` via `SET LOCAL`
 * (through `set_config`'s `is_local` arg) as the first statement of a
 * transaction — see `../utils/with-rls-context.ts` for the full "why a
 * transaction, why SET LOCAL not SET" rationale (same reasoning applies
 * here, not repeated).
 *
 * `overrides` (explicit `{ userId, profileId }` passed into
 * `TransactionPort.execute()`/`.withTx()`, see `@workspace/ports`) take
 * priority over the request-scoped `getCurrentUser()` context per key — for
 * call sites where the real identity/profile is already a known local
 * variable but hasn't reached `getCurrentUser()` yet (e.g. session issuance
 * before any JWT exists, or a profile resolved just ahead of the
 * transaction). Falls back to `getCurrentUser()?.id`/`?.role` for `userId`
 * when no override is given; `profileId` has no ambient fallback (there is
 * no "current profile" on `getCurrentUser()`), so it's left unset unless
 * explicitly provided. `null`/absent for a given key leaves it unset; RLS
 * policies must fail closed for that case (see `docs/infrastructure/
 * runbooks/db-rls-policies.sql`), and correctly do — every INSERT-time flow
 * with no resolved identity yet relies on that file's staff/worker bypass or
 * explicit override, not an ambient "unrestricted" default.
 */
async function setRlsSessionContext(
  tx: { $executeRaw: PrismaService['$executeRaw'] },
  overrides?: { userId?: string | null; profileId?: string | null },
): Promise<void> {
  const user = getCurrentUser();
  const effectiveUserId = overrides?.userId ?? user?.id ?? null;
  const effectiveProfileId = overrides?.profileId ?? null;
  const effectiveRole = overrides?.userId ? null : (user?.role ?? null);

  // if (effectiveUserId) {
  //   await tx.$executeRaw`SELECT set_config('app.user_id', ${effectiveUserId}, true)`;
  // }
  // if (effectiveProfileId) {
  //   await tx.$executeRaw`SELECT set_config('app.profile_id', ${effectiveProfileId}, true)`;
  // }
  // if (effectiveRole) {
  //   await tx.$executeRaw`SELECT set_config('app.user_role', ${effectiveRole}, true)`;
  // }

  // const promises = [];

  // if (effectiveUserId) {
  //   promises.push(tx.$executeRaw`SELECT set_config('app.user_id', ${effectiveUserId}, true)`);
  // }
  // if (effectiveProfileId) {
  //   promises.push(tx.$executeRaw`SELECT set_config('app.profile_id', ${effectiveProfileId}, true)`);
  // }
  // if (effectiveRole) {
  //   promises.push(tx.$executeRaw`SELECT set_config('app.user_role', ${effectiveRole}, true)`);
  // }

  // if (promises.length > 0) {
  //   await Promise.all(promises);
  // }

  // Execute all set_config calls in ONE network round-trip
  await tx.$executeRaw`
    SELECT 
      set_config('app.user_id', ${effectiveUserId}, true),
      set_config('app.profile_id', ${effectiveProfileId}, true),
      set_config('app.user_role', ${effectiveRole}, true);
  `;
}

/**
 * Concrete binding for TransactionPort (@workspace/ports), the transaction
 * contract database-core's TransactionRunner and every persistence package
 * consume. Bound to PRISMA_TRANSACTION_PORT_TOKEN, aliased to the neutral
 * TRANSACTION_PORT_TOKEN in PrismaModule.
 *
 * This is the single, central place every explicit multi-statement business
 * transaction in the codebase passes through (per its own prior doc comment:
 * "every persistence package" consumes this) — including transactions that
 * span multiple bounded contexts via an ApplicationPort (e.g. `modules/
 * enrolments`' create-enrolment use-case calling into `modules/billing`'s
 * order-creation port with the same `tx`). Setting the RLS session context
 * here, once, means individual adapters do NOT need to each re-derive it for
 * the "I was handed an existing tx" case — only a bare, no-tx call needs the
 * narrower `withRlsContext` wrapper (`../utils/with-rls-context.ts`).
 */
@Injectable()
export class PrismaTransactionAdapter implements TransactionPort {
  constructor(@Inject(PRISMA_CLIENT_TOKEN) private readonly prisma: PrismaService) {}

  async execute<T>(
    operation: (tx: unknown) => Promise<T>,
    options?: {
      maxRetries?: number;
      isolationLevel?: unknown;
      timeout?: number;
      userId?: string | null;
      profileId?: string | null;
    },
  ): Promise<T> {
    const maxAttempts = Math.max(1, options?.maxRetries ?? 1);
    const overrides = { userId: options?.userId, profileId: options?.profileId };
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            await setRlsSessionContext(tx, overrides);
            return operation(tx);
          },
          {
            timeout: options?.timeout,
            isolationLevel: options?.isolationLevel as Prisma.TransactionIsolationLevel | undefined,
          },
        );
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError;
  }

  withTx<T>(
    fn: (tx: unknown) => Promise<T>,
    overrides?: { userId?: string | null; profileId?: string | null },
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await setRlsSessionContext(tx, overrides);
      return fn(tx);
    });
  }

  async setContext(
    tx: unknown,
    overrides: { userId?: string | null; profileId?: string | null },
  ): Promise<void> {
    await setRlsSessionContext(tx as { $executeRaw: PrismaService['$executeRaw'] }, overrides);
  }
}
