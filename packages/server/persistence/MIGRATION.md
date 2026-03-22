## Persistence Ownership Migration

Canonical ownership is now fixed:

- Auth/account/session/token state lives in PostgreSQL via Prisma.
- Transactional event state (`OutboxEvent`, `IdempotencyKey`, `SagaState`) lives in PostgreSQL via Prisma.
- MongoDB is no longer a canonical source of truth for those entities. It is reserved for future projections/read models.

Operational implications:

1. `AUTH_REPO_DRIVER`, `TRANSACTION_DRIVER`, and `EVENTS_STORE_DRIVER` were removed.
2. `DATABASE_URL` must point to PostgreSQL for both `api` and `workers`.
3. Existing auth or event state that was previously stored in MongoDB must be migrated before deploying this refactor into an environment with live data.
4. MongoDB remains optional unless and until a bounded context introduces an explicit projection/read-model adapter.

Storage note:

- Blob/file storage now has its own provider boundary in `@repo/storage`.
- File metadata models remain in Prisma; blob storage provider selection is configured via `STORAGE_*` env vars.
