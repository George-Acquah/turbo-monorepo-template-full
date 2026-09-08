export abstract class TransactionPort {
  abstract execute<T>(
    operation: (tx: unknown) => Promise<T>,
    options?: {
      maxRetries?: number;
      isolationLevel?: unknown;
      timeout?: number;
      /**
       * Explicit RLS identity for this transaction — set once, as the first
       * statement, before `operation` runs (see `docs/infrastructure/runbooks/
       * db-rls-policies.sql`'s v5 entry). Use when the real user/profile is
       * already a known local variable at the call site but hasn't reached
       * `getCurrentUser()`'s request-scoped context yet (e.g. session
       * issuance before any JWT exists, or profile-keyed writes resolved
       * ahead of the transaction). Falls back to `getCurrentUser()` per key
       * when omitted, so existing authenticated-request transactions are
       * unaffected.
       */
      userId?: string | null;
      profileId?: string | null;
    },
  ): Promise<T>;
  abstract withTx<T>(
    fn: (tx: unknown) => Promise<T>,
    overrides?: { userId?: string | null; profileId?: string | null },
  ): Promise<T>;
  /**
   * Sets `app.user_id`/`app.profile_id` on an already-open transaction
   * (the `tx` an `operation`/`fn` callback above received), for the case
   * where the real identity/profile isn't known until a write *inside* that
   * same transaction resolves it — e.g. a guest checkout's profile
   * find-or-create, which must stay inside the transaction for atomicity
   * (so a subsequent failure rolls the profile creation back too, not just
   * the enrolment/order writes). Call this once the id is known, before any
   * further RLS-protected write needs it; writes issued before this call
   * still run with whatever context `execute()`/`withTx()` set at the
   * start (unset, if none was given).
   */
  abstract setContext(
    tx: unknown,
    overrides: { userId?: string | null; profileId?: string | null },
  ): Promise<void>;
}

export const TRANSACTION_PORT_TOKEN = Symbol('TRANSACTION_PORT_TOKEN');
export const PRISMA_TRANSACTION_PORT_TOKEN = Symbol('PRISMA_TRANSACTION_PORT_TOKEN');
