# packages/server

## What This Area Is

Shared backend building blocks for the API and worker. These packages are NestJS-oriented and use a
ports/adapters style. They are not a complete API app by themselves.

## Architecture

- `ports` defines abstract boundaries, DI tokens, and contracts for auth, config, database, email,
  events, payments, queues, storage, WhatsApp, and shared services.
- `types` defines shared transport, event, contract, metadata, filter, and pagination types.
- `constants` centralizes domain constants and database constraint helpers.
- `config` validates environment and exposes runtime config slices.
- `auth/core` contains JWT/local auth, strategies, token/hash/MFA services.
- `auth/guards` contains the guard classes (`JwtAuthGuard`, `LocalAuthGuard`, `RefreshTokenGuard`,
  `OptionalAuthGuard`) — split out from `auth/core` so a consumer that only needs `@UseGuards(...)`
  doesn't depend on `auth/core`'s full weight (argon2, otplib, qrcode, passport strategies).
- `auth/providers/*` contains OAuth provider adapters.
- `infrastructure/*` contains concrete adapters for Prisma, Redis, queues, email, storage, etc.
- `events` contains event dispatch/routing/processors/sagas.
- `context`, `filters`, `interceptor`, `cache`, `http`, and `observability` are shared Nest modules.

## Commands

Run only focused package commands:

- Typecheck: `pnpm --filter @workspace/<package-name> check-types`
- Build: `pnpm --filter @workspace/<package-name> build`
- Lint: `pnpm --filter @workspace/<package-name> lint`

Do not run repo-wide scripts by default.

## Conventions

- Prefer ports/tokens over importing concrete adapters into core logic.
- Keep package exports intentional through each package's `src/index.ts` and `package.json` exports.
- Do not import from `apps/**` into any package.
- Keep `@workspace/constants`, `@workspace/types`, and `@workspace/ports` as the single source for
  shared enums/contracts instead of duplicating local copies.
- Preserve strict TypeScript. Avoid `any`; model unknown boundaries explicitly.
- For Nest modules, keep providers injectable and testable without booting an entire app.
- Use structured config from `@workspace/config`; do not read `process.env` throughout services.
- Throw exceptions that carry a machine-readable `errorCode`, not bare Nest exceptions — the global
  filter (`packages/server/filters`) already forwards whatever `errorCode` is present in the thrown
  exception's body onto the response envelope. Use the status-mapped base classes in
  `packages/server/utils/src/error/app-exceptions.ts` (`UnauthorizedAppException`,
  `ForbiddenAppException`, `NotFoundAppException`, `ConflictAppException`, `BadRequestAppException`,
  `InternalAppException`) and pass a code from the matching `{Domain}ErrorCodes` map in
  `packages/server/constants/src/errors/`. Add new codes there rather than inlining raw strings.
  Domain-specific named exceptions are colocated with their domain (e.g. auth's live in
  `packages/server/auth/core/src/constants/auth.errors.ts`) and extend those base classes.
- Event consumption goes through `QueueConsumerTransport` (`@workspace/ports`), not a transport
  SDK directly. BullMQ is the only implementation (`@workspace/queue`'s `bullMqConsumerTransport`,
  built from `createDomainEventConsumer`/`createQueueConsumer` in
  `packages/server/infrastructure/queue/src/factories/`) — a new transport (e.g. RabbitMQ) means
  implementing that same interface in a new package; module wiring only changes which factory it
  imports, never how it's called. Mirrors `QueueBusPort` on the produce/dispatch side.

## Tests

There are commented Jest-style tests in some packages but test scripts are not consistently wired.
For backend features or behavior changes, add/update focused tests where practical and wire the
smallest local test command if needed. If a test harness is missing and adding one is outside scope,
say that clearly.

## Security

- Never log secrets, tokens, raw credentials, PII, or payment details.
- Hash tokens/passwords through existing auth/hash services.
- Webhook signature verification is mandatory.
- Payment/order/subscription state transitions should be explicit, auditable, and server-owned.
