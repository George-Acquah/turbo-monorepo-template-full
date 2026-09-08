# apps/api

## Status

Bootstrapped and boots correctly. Cross-cutting modules are wired in `app.module.ts`: config
(`@workspace/config`), cache (`@workspace/cache`), Redis (`@workspace/redis`), observability/logging
(`@workspace/observability`), global exception filter (`@workspace/filters`), and response/hierarchy
interceptors (`@workspace/interceptor`). CORS, origin-auth middleware, global validation pipe, and
Swagger (`/api/docs`, non-production) are set up in `app.setup.ts`/`src/setups/`.

Six bounded-context feature modules ship: `auth` (the reference shape to copy — see
`modules/CLAUDE.md` for the internal `domain/` `application/` `infrastructure/` `presentation/`
layering), `identity` (RBAC + API clients/keys), `profiles` (profile + GDPR consent),
`notifications` (HTTP self-service preferences + inbox; sending stays worker-side), `audit`, and
`files` (S3 presigned upload flow). `router.module.ts` (`AppRoutingModule`) is the single source
of truth for the route tree — modules never declare their own path prefix, they're composed
there. `src/metrics/` is an app-level admin-reporting example (not a bounded context) — replace
its queries with your product's KPIs.

Add a context by importing its `<context>.module.ts` into `featureModules` and spreading its
`<context>Routes.v1` into the `v1` children.

`modules/{context}` — one workspace package per bounded context — is ESLint-enforced:
`packages/configs/eslint/base.ts`'s `buildContextBoundaryZones` auto-generates
`import/no-restricted-paths` zones from the top-level `modules/{context}` directory matched against
`packages/server/ports/src/database/schema/{context}` folder names, so `modules/identity/**` can
only import `.../schema/identity/**`, never another context's ports, and can't reach into another
module's internals directly. This activated automatically once `modules/` was created and
`pnpm-workspace.yaml`'s `modules/*` line was uncommented — no further ESLint config changes needed
for new modules. (One correction from when this was first documented: the zone generator originally
used `except` to carve out a module's own files from the cross-module restriction — confirmed
non-functional in this ESLint 9 + eslint-plugin-import@2.32 combination via direct testing, so it now
generates one explicit zone per *other* context/module instead, same workaround already used by
`buildDatabaseCoreIsolationZones`.)

Guards (`JwtAuthGuard`, `LocalAuthGuard`, `RefreshTokenGuard`, `OptionalAuthGuard`) live in
`@workspace/guards` (`packages/server/auth/guards`), not `@workspace/auth-core` — extracted so a module
package that only needs `@UseGuards(...)` doesn't have to depend on `@workspace/auth-core`'s full weight
(argon2, otplib, qrcode, passport strategies). `@workspace/auth-core`'s `AuthCoreModule` (imported once,
globally, here) is still what registers the underlying Passport strategies those guards resolve by
name at runtime.

Copy `.env.example` to `.env` and fill it in. The Prisma CLI in this repo is pinned to v7
(`packages/server/infrastructure/databases/prisma/package.json`); run
`pnpm --filter @workspace/prisma prisma:generate` then, on a fresh database,
`pnpm --filter @workspace/prisma prisma:migrate:dev` to create the initial migration (none ships).

## Intended Direction

- Runtime/framework: NestJS, matching the server packages.
- Config: `@workspace/config`
- Auth: `@workspace/auth-core` (JWT/refresh/MFA primitives, strategies), `@workspace/guards` (guard
  classes), `@workspace/auth` (the login/register/refresh feature module), Google/GitHub provider
  packages.
- Persistence: `@workspace/prisma` for PostgreSQL, with persistence behind ports.
- Shared contracts: `@workspace/types`, `@workspace/ports`, `@workspace/constants`.
- Queue/events integration: `@workspace/events`, `@workspace/queue`, `@workspace/redis`.
- Observability: `@workspace/observability`

## Conventions When Building It

- Keep controllers thin. Put business logic in services/use cases.
- Validate every request before it reaches business logic.
- Return only the user fields a route needs. Do not leak full user records.
- Keep payments, subscriptions, refunds, and paywall state behind explicit service boundaries.
- Do not trust frontend-supplied prices, roles, subscription states, or payment statuses.
- Webhook signature verification is required in every environment.
- Prefer provider tokens and ports from `@workspace/ports` over direct adapter coupling.

## Payments And Compliance

This app will own high-risk flows such as auth, payment initiation, payment verification, webhook
handling, subscription state, refunds, and member access. Treat schema changes to users, sessions,
payments, subscriptions, orders, and enrolments as high-risk. Explain assumptions before changing
those flows.

## Testing

Backend features should include focused tests where practical. If the API app is scaffolded, add a
package-local test command and run only the affected app/package checks.
