# Template status

This monorepo was extracted from a larger product codebase: the architecture and cross-cutting
infrastructure were kept, all business domains were removed, and the `@smartsnr/*` namespace was
renamed to `@workspace/*`.

## Verified (built / typechecked clean on extraction)

Run from the repo root after `pnpm install` and `pnpm --filter @workspace/eslint build`:

| Area | Check | Result |
|---|---|---|
| Shared ESLint config | `pnpm --filter @workspace/eslint build` | ✅ |
| Foundational server pkgs | build `constants`, `types`, `ports`, `utils` | ✅ |
| Infra server pkgs | build `context` `decorators` `databases-core` `redis` `queue` `events` `cache` `filters` `http` `interceptor` `observability` `encryption` `idempotency` `rate-limit` `realtime` `templates` `brand-tokens` `config` `email` `storage` `document` `sms` `whatsapp` `push` `payment-providers` `testing` | ✅ |
| Auth stack | build `auth-core` `guards` `permissions` `profile-context` `google` `github` | ✅ |
| Prisma | `prisma:generate` (Prisma **7.10**), `generate:postgres-constants` (34 models) | ✅ |
| Persistence adapters | build `auth`/`identity`/`audit`/`notifications`/`profiles`/`files`/`outbox`-persistence | ✅ |
| Mongo | build `@workspace/mongo` | ✅ |
| Seed | `pnpm --filter @workspace/seed check-types` | ✅ |
| Bounded-context modules | build `auth` `identity` `audit` `notifications` `profiles` `files` | ✅ |
| Backend apps | `pnpm --filter @workspace/api check-types`, `... @workspace/worker check-types` | ✅ |
| Client foundation | build `client-types` `client-lib` `client-api` `client-hooks`; check-types `client-theme` `client-turnstile` `client-ui-{primitives,forms,overlays,pagination,table,charts}` | ✅ |
| Frontend apps | `pnpm --filter @workspace/dashboard check-types`; `@workspace/landing` full `next build` (3 static routes) | ✅ |
| ESLint rules | `pnpm --filter @workspace/{auth,notifications,dashboard,api,landing} lint` (exercises the context-boundary zones + `workspace/event-ownership`) | ✅ |

Not run: a full `turbo run build` / repo-wide typecheck (deliberately — low-RAM rule), the
NestJS `nest build` bundle for the apps (only `tsc` check-types was run), the app dev servers,
and any runtime/e2e test (no database/redis/mongo was provisioned).

## Known limitations / first-run TODOs

1. **No Prisma migrations ship.** `prisma/schema/` has 7 context files
   (`auth` `identity` `profiles` `notifications` `files` `audit` `outbox`). On a fresh database:
   `pnpm --filter @workspace/prisma prisma:generate` then
   `pnpm --filter @workspace/prisma prisma:migrate:dev` to create the initial migration, then
   `pnpm --filter @workspace/prisma generate:postgres-constants`. Prisma is pinned to `^7.10.0`
   (the source repo's `latest` had floated to an 8.x RC with a broken CLI).
2. **`openapi-types.ts` is the source project's, not regenerated.** It still describes endpoints
   the trimmed API no longer serves. Start `apps/api` and run
   `pnpm --filter @workspace/client-types generate-openapi`. Until then, dashboard/landing calls
   to missing endpoints typecheck but 404 at runtime.
3. **`packages/server/infrastructure/payment-providers`** (Paystack/Hubtel/Flutterwave adapters
   on `PaymentGatewayPort`) has **no consuming module** — billing was removed. Add a billing
   context to use it, or delete the package.
4. **`packages/server/constants`** still carries some legacy domain string enums (queue names,
   notification/email categories, aggregate ids, redis key prefixes) for contexts that no longer
   exist. Harmless unused strings — prune as you add your own.
5. **`packages/server/templates`** ships the full transactional template set (including
   `enrolment-*`, `subscription-*`, `event-*`, `indicator-*` `.mjml`/`.hbs` files). Kept whole so
   the `generate-constants` pipeline and the email-category maps stay coherent — delete the ones
   you don't need and re-run its build.
6. **`packages/server/infrastructure/databases/prisma/src/constants/table-names.ts`** is a
   generated file still listing the source project's tables. Regenerate it with the project's
   table-names generator (or delete + rebuild) once your schema is settled.
7. **Namespace**: `@workspace/*`, `workspace_*` (Postgres schemas), `workspace.` (event names),
   `workspace/event-ownership` (ESLint plugin id), `app_*` (dashboard cookies). Rename per the
   `README.md` checklist when you start a real project.
8. **`apps/dashboard`** keeps the `member-shell` / `member-sidebar` / `member-topbar` widget
   directory names. Rename to `app-*` if you prefer — they are just names.
9. **`apps/landing`** is a clean generic FSD marketing site — `app` / `views` / `widgets` /
   `shared` layers, no business content, standalone (no `@workspace/client-*`, no API). Every
   editable string is a `[PLACEHOLDER]` token in `src/shared/config/site.ts` behind an
   `isConfigured()` guard. Replace `src/views/terms` with real reviewed legal copy before launch.
10. Node engine is declared `22.x`; the extraction machine ran Node 24 (harmless `Unsupported
    engine` warnings from pnpm).
