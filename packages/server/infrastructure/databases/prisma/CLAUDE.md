# @workspace/prisma

## What This Package Does

Prisma/PostgreSQL infrastructure package. It owns Prisma schema files, client generation, Nest
module/providers, and database helper scripts.

## Structure

- Prisma config: `prisma.config.ts`
- Main datasource/generator schema: `prisma/schema/schema.prisma`
- Bounded-context schemas: `prisma/schema/*.prisma` (auth, identity, profiles, catalog, etc.)
- Generated Prisma client output: `generated/prisma`
- Nest client/module/providers: `src/client/**`, `src/modules/**`, `src/providers/**`
- Generator & constraint scripts: `scripts/**`

The current Prisma datasource uses PostgreSQL and multiple schemas (workspace_auth, workspace_identity, etc.).
`auth.prisma` owns authentication data only: users, sessions, devices, auth providers, password/email
tokens, MFA, and invitations. Authorization, memberships, profiles, billing, and domain data are in
separate schemas and must not be coupled directly.

Some comments still mention `orvex_*` schemas. Treat those as legacy/domain-boundary notes unless
the user asks for a naming cleanup.

### Database Constants Generation

The `scripts/generate-postgres-constants.ts` script parses the Prisma schema and automatically generates
database constants into `@workspace/constants/src/database/postgres.constants.generated.ts`. This is
run as part of the `build` script and happens before TypeScript compilation.

Generated exports:
- `Schemas` — map of schema names (e.g., `Schemas.AUTH` → `'workspace_auth'`)
- `Tables` — map of table names (e.g., `Tables.USERS` → `'users'`)
- `ModelToTable` — Prisma model name to {schema, table} mapping
- `TableToModel` — database table name to Prisma model name mapping

Handwritten constants in `postgres.constants.ts` re-export the generated exports plus add:
- `AppDatabaseRoles` — application database roles (api, worker, readonly)
- `AppendOnlyTables` — audit tables that cannot be updated/deleted after creation

This approach ensures constants never drift from the schema.

## Commands

Focused commands only:

- Typecheck: `pnpm --filter @workspace/prisma check-types`
- Build: `pnpm --filter @workspace/prisma build` (runs generator + TypeScript build)
- Lint: `pnpm --filter @workspace/prisma lint`
- Generate Prisma client: `pnpm --filter @workspace/prisma prisma:generate`
- Generate database constants: `pnpm --filter @workspace/prisma generate:postgres-constants`
- Build check constraints: `pnpm --filter @workspace/prisma build:check-constraints`

The `build` command automatically runs the constants generator first, so you only need to run
`build` in the normal workflow. Use `generate:postgres-constants` manually only if the constants
become out of sync with the schema (which should not happen during normal development).

Do not run `prisma:reset`, `prisma:migrate:dev`, `prisma:migrate:check-constraints`, or
`migrate:deploy` unless the user explicitly requests migration work.

## Schema Conventions

- Keep bounded contexts separated by schema files and database schemas.
- Do not add Prisma cross-schema relations that couple auth to other domains. Store external IDs as
  strings and resolve them in application logic.
- Preserve `@@map`, `@map`, and `@@schema` consistency.
- Keep Ghana-friendly defaults where relevant, such as `Africa/Accra` and `GHS`.
- Do not store raw tokens or secrets; store hashes/encrypted values according to the auth design.
- Treat user/session/payment/subscription/order-related schema changes as high-risk.

## Testing And Verification

For schema-only changes, at minimum run Prisma generation and focused typecheck when feasible. For
behavioral adapter changes, add/update focused tests if the harness exists or is being introduced.
