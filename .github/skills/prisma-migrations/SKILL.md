# Prisma Migrations Skill

## When to use this skill

Use this skill whenever:

- You need to add, remove, or rename a column, table, index, or relation in a `.prisma` schema file.
- You encounter a "migration was modified after it was applied" drift error.
- You need to understand the correct workflow for making database schema changes.

This covers `@workspace/prisma`
(`packages/server/infrastructure/databases/prisma`), the only Prisma package in the repo. There are
only **two** schema files today: `schema.prisma` (main datasource/generator + primary business schema)
and `auth.prisma` (auth bounded context only). There is no tenancy/academics/fees/payments/audit
domain split — don't assume schema files that don't exist.

---

## Golden rules — commit to memory

| Rule                                                                    | Why                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Never manually edit any file inside `prisma/migrations/`**            | Prisma stores a SHA-256 checksum of every migration file in `_prisma_migrations`. Any edit changes the file's hash and causes "migration was modified" drift on every subsequent `migrate dev` run, blocking all future migrations until manually fixed. |
| **Never add SQL to an existing migration file**                         | Same reason as above — it corrupts the stored checksum.                                                                                                                                                                                                  |
| **Never delete a migration file that has already been applied**         | Prisma will try to re-apply it or report drift, potentially causing data loss.                                                                                                                                                                           |
| **Always generate a new migration for every schema change**             | Run `pnpm --filter @workspace/prisma prisma:migrate:dev` after editing any `.prisma` file. Let Prisma diff the schema and produce the SQL. Only run this when a migration has actually been requested — it's off-limits by default (see root `CLAUDE.md`, `.claude/settings.json`). |
| **Never run `prisma:reset` (`prisma migrate reset`) on a shared or production database** | It drops and recreates all schemas — permanent data loss. Also off-limits by default. |
| **`pnpm --filter @workspace/prisma prisma:generate` must follow every Prisma schema edit** | Regenerates the Prisma client TypeScript types. Without it, downstream consumers will have stale types. |

---

## Correct workflow for every database change

```
1. Edit the .prisma schema file(s) in:
   packages/server/infrastructure/databases/prisma/prisma/schema/{schema,auth}.prisma

2. Regenerate the Prisma client:
   pnpm --filter @workspace/prisma prisma:generate

3. Create and apply the migration (only when explicitly requested):
   pnpm --filter @workspace/prisma prisma:migrate:dev
   (Prisma will prompt for a migration name — use snake_case, e.g. add_invoice_reminder_status)

4. Verify the generated migration SQL in:
   packages/server/infrastructure/databases/prisma/prisma/migrations/<timestamp>_<name>/migration.sql

5. Type-check affected packages:
   pnpm --filter @workspace/prisma check-types
   pnpm --filter @workspace/<consumer-package> check-types   # any package/adapter consuming the changed model
```

Do not skip step 2 — stale Prisma client types cause type errors in whatever persistence adapter
consumes the changed model (e.g. `packages/server/infrastructure/persistence/auth` for auth-schema
changes).

---

## How to recover from a manually-modified migration

> **Scenario**: Someone (or an AI) edited an already-applied migration file inside `prisma/migrations/`.
> Now `prisma:migrate:dev` reports:
>
> ```
> The migration `<name>` was modified after it was applied.
> We need to reset the following schemas...
> ```

This is real Prisma checksum-drift behavior — the recovery steps below are the general Prisma
workflow, not specific to any fictional database. **Never hardcode real connection credentials in this
file or any committed file.** Read `DATABASE_URL` from your own local `.env` (not committed) and
substitute the placeholders below — `<user>`, `<password>`, `<host>`, `<dbname>` — with your actual
local values when running these commands. Never paste real credentials into a shared/committed
document, a commit message, or a tool-output log.

### Step 1 — Revert the migration file to remove the manual changes

Undo any edits made to the migration `.sql` file so it contains only what was originally applied.
If you are unsure of the original content, see Step 2 first to find the true original hash.

### Step 2 — Identify the stored checksum vs. the current file hash

```bash
# Hash stored in _prisma_migrations
PSQLRC=/dev/null PGPASSWORD=<password> psql -U <user> -h <host> -d <dbname> \
  -t -A -P pager=off \
  -c "SELECT checksum FROM public._prisma_migrations WHERE migration_name = '<migration_name>';"

# Hash of the current migration file
sha256sum packages/server/infrastructure/databases/prisma/prisma/migrations/<migration_name>/migration.sql \
  | awk '{print $1}'
```

If the two hashes match → the file is already correct. Move to Step 4.
If they differ → the file still does not match what was applied. Continue with Step 3.

### Step 3 — Directly update the stored checksum to match the current file

> Use this **only** when the DB already has all the changes the migration intended (i.e. the columns /
> indexes from the migration DO exist in the DB), and you simply need to re-sync the recorded
> checksum.

```bash
# Compute the new hash
NEW_HASH=$(sha256sum packages/server/infrastructure/databases/prisma/prisma/migrations/<migration_name>/migration.sql | awk '{print $1}')

# Update the stored checksum
PSQLRC=/dev/null PGPASSWORD=<password> psql -U <user> -h <host> -d <dbname> \
  -t -A -P pager=off \
  -c "UPDATE public._prisma_migrations
      SET checksum = '${NEW_HASH}'
      WHERE migration_name = '<migration_name>'
      RETURNING migration_name, checksum;"
```

The `_prisma_migrations` table lives in the `public` PostgreSQL schema. Get `<user>`, `<password>`,
`<host>`, and `<dbname>` from your own local `DATABASE_URL` env var — never hardcode them here.

### Step 4 — Apply any missing DDL directly (if needed)

If the manual edit added SQL that was never actually run against the database (e.g. a CREATE INDEX
that exists in the file but not in the DB), apply it now with `prisma db execute`:

```bash
cd packages/server/infrastructure/databases/prisma
echo 'CREATE INDEX IF NOT EXISTS "my_idx" ON "schema"."table"("col");' \
  | pnpm prisma db execute --stdin --config ./prisma.config.ts
```

Or verify the DB state first:

```bash
PSQLRC=/dev/null PGPASSWORD=<password> psql -U <user> -h <host> -d <dbname> \
  -t -A -P pager=off \
  -c "SELECT indexname FROM pg_indexes WHERE schemaname='<schema>' AND tablename='<table>' ORDER BY indexname;"
```

### Step 5 — Run `migrate dev` to apply any remaining pending schema changes

Once the checksum is fixed, `migrate dev` will no longer report drift and will generate a clean new
migration for any schema changes that still need to be applied:

```bash
pnpm --filter @workspace/prisma prisma:migrate:dev
```

### Step 6 — Regenerate and type-check

```bash
pnpm --filter @workspace/prisma prisma:generate
pnpm --filter @workspace/prisma check-types
pnpm --filter @workspace/<affected-consumer-package> check-types
```

---

## Why `prisma migrate resolve --applied` does NOT help here

`prisma migrate resolve --applied <name>` only works for migrations that have **never been recorded**
in `_prisma_migrations` (baseline scenario). If the migration is already marked as applied, Prisma
returns:

```
Error: P3008 — The migration is already recorded as applied in the database.
```

The correct fix for an already-applied migration with a checksum mismatch is the direct SQL `UPDATE`
in Step 3 above.

---

## Database connection for local dev

Never hardcode a real host/user/password/database name in this file or any other committed file.
Connection details live only in your own local, uncommitted `.env` (`DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>`)
under `packages/server/infrastructure/databases/prisma/`. Read them from there when you need to run
`psql` directly — do not write them into a skill file, a commit, a PR description, or any other
shared/committed location.

| Property             | Where to find it                                                          |
| --------------------- | -------------------------------------------------------------------------- |
| Connection details    | Your local `DATABASE_URL` env var (never committed)                       |
| Migrations table      | `public._prisma_migrations`                                                |
| Prisma config         | `packages/server/infrastructure/databases/prisma/prisma.config.ts`         |
| Schema directory      | `packages/server/infrastructure/databases/prisma/prisma/schema/`           |
| Migrations directory  | `packages/server/infrastructure/databases/prisma/prisma/migrations/`       |
