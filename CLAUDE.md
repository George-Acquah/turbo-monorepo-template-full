# Monorepo Template

## What This Project Is

A reusable full-stack monorepo template: pnpm + Turborepo, a NestJS ports/adapters backend
with `modules/{context}` bounded contexts and a transactional-outbox / domain-event bus, and a
layered `packages/client/*` UI + typed-API foundation feeding a Next.js dashboard app and a
minimal marketing site.

It ships the **architecture and the cross-cutting infrastructure only** — auth, identity/RBAC,
audit, notifications, profiles, files. There is no business domain. Add your product's contexts
on top; see `docs/architecture/layers.md` and `modules/CLAUDE.md`.

The package namespace is `@workspace/*`. Rename it (a repo-wide `@workspace/` → `@yourscope/`
find/replace, plus the `workspace_*` Postgres schema prefixes and the `workspace/event-ownership`
ESLint plugin id) when you start a real project.

## Apps

- `apps/api` — NestJS HTTP backend. Cross-cutting infra (config, cache, Redis, observability,
  filters, interceptors, rate limiting, realtime SSE, encryption, queue, Prisma, Mongo, outbox,
  event bus) is wired in `app.module.ts`; feature modules are route-composed in `router.module.ts`
  (`AppRoutingModule`). See `apps/api/CLAUDE.md`.
- `apps/worker` — NestJS background worker: drains the transactional outbox and dispatches domain
  events onto per-consumer queues; hosts the reacting half of each bounded-context module. See
  `apps/worker/CLAUDE.md`.
- `apps/dashboard` — authenticated Next.js App Router dashboard, strict Feature-Sliced Design,
  built from `packages/client/*`. Ships the shell (glass surfaces, sidebar/topbar, mobile nav,
  command palette), auth/session/proxy wiring, and stub `dashboard` / `login` / `account` /
  `welcome` screens. Clone it for a second authenticated surface. See `apps/dashboard/CLAUDE.md`.
- `apps/landing` — generic public marketing site (Next.js App Router, its own small token set,
  SEO/OG/JSON-LD infra, placeholder-config pattern in `src/shared/config/site.ts`). Feature-Sliced
  Design, standalone (no `@workspace/client-*` / API). See `apps/landing/CLAUDE.md`.

## Package Map

- `packages/configs/eslint` — shared flat ESLint configs (base / Next.js / React / NestJS), plus
  the filesystem-driven context-boundary zone generators and the local `workspace/event-ownership`
  rule. Built with `tsc` to `dist/` — **build it first**, every other flat config imports it.
- `packages/configs/typescript` — shared strict TS presets (`base` / `nestjs` / `nextjs` / `react-library`).
- `packages/testing` — generic Nest/Jest test helpers (`createMock`, db/time/infra mocks).
- `packages/server/auth/core` (`@workspace/auth-core`) — JWT/local/refresh strategies, token/hash/MFA services, OAuth registry.
- `packages/server/auth/guards` — `JwtAuthGuard`/`LocalAuthGuard`/`RefreshTokenGuard`/`OptionalAuthGuard`, split from core so `@UseGuards(...)`-only consumers skip argon2/otplib/qrcode/passport.
- `packages/server/auth/permissions` — `PermissionsGuard`/`RolesGuard` + resolver (RBAC).
- `packages/server/auth/profile-context` — resolves the caller's profile id into request context.
- `packages/server/auth/providers/{google,github}` — OAuth adapter modules.
- `modules/{context}` — one workspace package per bounded context (`auth`, `identity`, `audit`,
  `notifications`, `profiles`, `files`): the application/domain layer on top of `ports` +
  `infrastructure/persistence/*`. Two composition roots per package (`{context}.module.ts` for
  apps/api, `{context}.worker.module.ts` for apps/worker). Internal layering and the event rules
  are in `modules/CLAUDE.md`. Context boundaries are ESLint-enforced via `buildContextBoundaryZones`.
- `packages/server/cache` — Nest cache module + `@Cacheable` + interceptor (Redis-backed).
- `packages/server/config` — validated runtime config and env loading.
- `packages/server/constants` — shared constants (auth, ids, transport, queues, storage, validation,
  database constraints, scheduling, workflow).
- `packages/server/context` — AsyncLocalStorage request-context module/middleware.
- `packages/server/decorators` — Nest metadata decorators (roles, permissions, headers, rate limits, response wrapping).
- `packages/server/encryption` — AES-GCM adapter + module (`ENCRYPTION_PORT_TOKEN`).
- `packages/server/events` — the domain-event backbone: outbox dispatch, routing compiler,
  subscription registry, sagas, publisher/processing/worker modules.
- `packages/server/filters` — HTTP + websocket exception filters (envelope errors).
- `packages/server/http` — Nest Axios-based HTTP client module/service.
- `packages/server/idempotency` — idempotency interceptor + `@Idempotent`.
- `packages/server/interceptor` — response envelope + API-logging interceptors.
- `packages/server/observability` — logging, Prometheus metrics, observability module.
- `packages/server/ports` — abstract ports/tokens (auth, config, database, email, events, payments,
  queues, storage, sms, whatsapp, push, captcha, encryption) + per-context DB schema ports.
- `packages/server/rate-limit` — Redis rate-limit guard/service/module.
- `packages/server/realtime` — SSE controller bridging Redis pub/sub → browser.
- `packages/server/types` — shared transport/contract/metadata/pagination/filter types + the
  central domain-event catalog (`events/domain-events.constants.ts` + `events/payloads/*`).
- `packages/server/utils` — ids, CUIDs, formatting, date/number/string/error utilities.
- `packages/server/templates` — Handlebars/MJML transactional template engine + assets.
- `packages/server/brand-tokens` — email-safe brand colour map (swap the values).
- `packages/server/seed` — `tsx`-run seed runner: identity (roles/permissions) + bootstrap admin.
- `packages/server/infrastructure/databases/prisma` — Prisma/PostgreSQL adapter, schema (per-context
  `.prisma` files), RLS-context util, `generate:postgres-constants`. **No migrations are shipped** —
  run `pnpm --filter @workspace/prisma prisma:migrate:dev` once on a fresh database.
- `packages/server/infrastructure/databases/mongo` — Mongoose module + notification document schemas.
- `packages/server/infrastructure/databases/core` — shared DB base (health aggregator, transaction runner).
- `packages/server/infrastructure/persistence/{auth,identity,audit,notifications,profiles,files,outbox}` — thin Prisma/Mongo adapters bound 1:1 to a schema.
- `packages/server/infrastructure/redis` — Redis/ioredis Nest module.
- `packages/server/infrastructure/queue` — BullMQ queue module, consumer factories, processors, partitioning, scheduler.
- `packages/server/infrastructure/email` — multi-provider email (Resend/Mailgun/SMTP/Mailtrap) via queue/cache/ports.
- `packages/server/infrastructure/storage` — local / S3 / R2 storage adapters.
- `packages/server/infrastructure/document` — Puppeteer HTML→PDF.
- `packages/server/infrastructure/messaging/{sms,whatsapp,push}` — Twilio SMS/WhatsApp, Meta Cloud WhatsApp, FCM push delivery adapters.
- `packages/server/infrastructure/payment-providers` — `PaymentGatewayPort` adapters (Paystack/Hubtel/Flutterwave) as a worked example. No consuming module ships — add a billing context to use it.
- `packages/client/types` — OpenAPI types (`openapi-typescript` against `apps/api`'s `/docs-json`,
  do not hand-edit — regenerate with `pnpm --filter @workspace/client-types generate-openapi`)
  plus shared envelope/pagination/action/realtime types.
- `packages/client/api` — typed API client (`createApiClient`/`createClientFetcher`, `unwrap`, `mapArray`/`mapPaginated`, `ApiError`).
- `packages/client/hooks` — shared React hooks (`useDebouncedValue`, `useClickAway`, `useMediaQuery`, `useIsMobile`, `useToggle`, `usePrevious`, `useRealtimeStream`).
- `packages/client/lib` — redacting logger, action/util helpers, one example zod validation slice (`validation/auth.ts`).
- `packages/client/theme` — OKLCH design tokens (CSS + JS) for the dashboard. Rebrand by editing the token values.
- `packages/client/turnstile` — Cloudflare Turnstile React widget (key is a prop).
- `packages/client/ui/{primitives,forms,overlays,pagination,table,charts}` — layered base-ui-style
  component library (primitives → forms/overlays → table/pagination → visx charts) the dashboard
  composes screens from. See `packages/client/CLAUDE.md` and `docs/client-foundation/README.md`.

## Stack

- Package manager: `pnpm@11.8.0` with workspaces. Runtime: Node `22.x`. Tooling: Turborepo.
- Frontend: Next.js `16`, React `19`, Tailwind CSS `4` (CSS-first, no `tailwind.config`), TypeScript, lucide-react; GSAP in `apps/landing` only.
- Backend: NestJS `11`, strict TypeScript, ports/adapters. Server packages/modules build with `tsdown`; apps with `nest build`.
- Database: PostgreSQL via a Prisma 7 package (multi-schema, one per bounded context). Mongo (Mongoose) for notification documents.
- Queue/cache: Redis/ioredis + BullMQ.
- Auth: JWT + refresh-token rotation, local auth, Google/GitHub OAuth, argon2, MFA primitives.

## Commands And Low-RAM Rule

Do not run repo-wide scripts unless explicitly approved. Avoid root `pnpm build`, `pnpm check-types`,
`pnpm lint`, `pnpm test`, `pnpm -r`, and broad Turbo runs by default.

Use focused package/app commands:

- Install: `pnpm install`
- Build the ESLint config first (every flat config imports its `dist/`): `pnpm --filter @workspace/eslint build`
- App dev/build/typecheck/lint: `pnpm --filter @workspace/<app> <dev|build|check-types|lint>`
- Server package: `pnpm --filter @workspace/<package-name> <build|check-types|lint>`
- Prisma generate: `pnpm --filter @workspace/prisma prisma:generate`
- Postgres constants: `pnpm --filter @workspace/prisma generate:postgres-constants`
- Seed: `pnpm --filter @workspace/seed seed`

When several packages are affected, identify the smallest safe set first.

## Git Workflow

- Branch feature/fix/docs work off `dev` and target `dev` as the PR base, unless a session's
  environment instructions specify otherwise for a designated feature branch.
- Retarget a mis-based PR (`base` field) rather than opening a duplicate.

## Repo Conventions

- Prefer existing package boundaries and exports over relative cross-package imports.
- Packages must not import from apps.
- Server packages depend on `@workspace/ports`, `@workspace/types`, `@workspace/constants` for
  shared contracts rather than redefining them.
- Keep controllers/routes thin. Business logic belongs in services/use cases; persistence behind ports/adapters.
- TypeScript is strict. Avoid `any`; model unknown boundaries with a narrow type or `unknown` + validation.
- Validate/parse all inputs. Never trust frontend-supplied amounts, roles, or access flags.
- Frontend apps (`apps/dashboard`, `apps/landing`) follow Feature-Sliced Design: `app → views → widgets → features → entities → shared`, downward imports only, one public `index.ts` per slice.
- Webhook signature verification is never optional, including dev/test helpers.
- Never log or expose PII, payment details, access/refresh tokens, webhook secrets, API keys, OAuth tokens, or raw secrets.

## Off Limits / High-Risk

- Do not run `prisma:reset`, `migrate:deploy`, or edit applied migrations unless explicitly requested.
- Do not run repo-wide build/typecheck/lint/test without explicit approval.
- Do not reshape the app/package layout unless asked.
- Do not bypass auth, paywall, subscription, or payment checks to make a feature pass locally.

## Claude Code Configuration

- `.claude/settings.json` encodes the "Off Limits" rules as `permissions.deny` Bash rules
  (repo-wide build/lint/test/`-r`, bare `turbo run`, Prisma reset/migrate/deploy, force-push, `rm -rf`).
  Keep it in sync if the off-limits list changes.
- `.mcp.json` configures two MCP servers, secrets via env vars only:
  - `github` — remote HTTP server for PR/issue workflows. Requires a `GITHUB_PAT` env var (fine-grained PAT, repo scope), not committed.
  - `postgres` — `@bytebase/dbhub` stdio server for DB introspection. Requires `DATABASE_URL`. Point it at a **read-only** role, never prod/admin.
- `.claude/agents/backend-feature.md` — subagent for `packages/server/*` and `modules/*` work.
- `.claude/agents/client-feature.md` — subagent for `packages/client/*` and `apps/dashboard`.

## Before Finishing

- Run the smallest focused checks that fit the touched app/package and the machine constraints.
- For backend feature changes, add/update focused tests where the module has a test harness.
- Report any checks not run and why.
