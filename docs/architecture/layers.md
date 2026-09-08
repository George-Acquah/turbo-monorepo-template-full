# How the layers fit

```
apps/                     thin composition roots — no business logic
  api        HTTP surface: app.module.ts wires cross-cutting infra;
             router.module.ts route-composes each modules/<context>.module.ts
  worker     drains the transactional outbox, dispatches domain events onto
             per-consumer queues, hosts each modules/<context>.worker.module.ts
  dashboard  authenticated Next.js app (Feature-Sliced Design) built from packages/client/*
  landing    marketing site

modules/<context>/        the business/application layer, one package per bounded context
  domain/         entities, value objects, state machines (often thin/absent)
  application/    use-cases, services, DTOs — reaches sideways only into @workspace/ports tokens
  infrastructure/ event-handlers, processors, schedulers, sagas
  presentation/   controllers, DTOs, guards
  <context>.module.ts         → imported by apps/api
  <context>.worker.module.ts  → imported by apps/worker
  <context>.produces.ts / <context>.subscriptions.ts  → the event contract

packages/server/*         framework-level building blocks behind ports/adapters
  ports          abstract ports + DI tokens + per-context DB schema ports
  types          transport/contract types + the central domain-event catalog
  constants      shared enums, ids, queue names, DB constraints
  events         outbox dispatch, routing compiler, subscription registry, sagas
  infrastructure/persistence/<context>   Prisma/Mongo adapter, 1:1 with a schema
  infrastructure/{redis,queue,email,storage,document,messaging/*,databases/*}
  {config,context,cache,rate-limit,realtime,observability,filters,interceptor,http,encryption,idempotency,decorators,utils,templates,brand-tokens}
  auth/{core,guards,permissions,profile-context,providers/*}

packages/client/*         the frontend foundation apps/dashboard composes from
  types          OpenAPI types (generated) + envelope/pagination/action/realtime types
  api            typed fetch client (createApiClient/unwrap/mappers/ApiError)
  hooks          generic React hooks + useRealtimeStream (SSE)
  lib            redacting logger, action/util helpers, example zod validation slice
  theme          OKLCH design tokens (CSS + JS)
  turnstile      Cloudflare Turnstile widget
  ui/{primitives,forms,overlays,pagination,table,charts}   layered component library
```

## Rules the tooling enforces

- **`packages/**` may not import from `apps/**`.** (`import/no-restricted-paths`)
- **`packages/server/**` ⇎ `packages/client/**`** are mutually walled off.
- **Cross-context isolation**: `modules/<a>/**` may not import `modules/<b>/**` internals, and may
  only touch its own `packages/server/ports/src/database/schema/<a>/**`. Cross-context needs go
  through a narrow `<b>ApplicationPortModule` + a `@workspace/ports` token.
  (`buildContextBoundaryZones` in `packages/configs/eslint/base.ts`, regenerated from the
  filesystem at lint time — it stays correct as you add contexts.)
- **Event ownership**: a module may only `publish(...)` an event listed in its own
  `<context>.produces.ts`. (`workspace/event-ownership` ESLint rule.)
- **The domain-event catalog is central**: every event constant + payload lives in
  `packages/server/types/src/events/`, never in a module.

## The event flow

1. A use-case appends an **outbox row** inside the same Postgres transaction as its write
   (`@workspace/events` `EventPublisherService`, needs only `TRANSACTION_PORT_TOKEN` +
   `OUTBOX_EVENT_REPOSITORY_TOKEN` — this is all `apps/api` does).
2. `apps/worker` **drains the outbox** on a schedule, consults the compiled **routing table**
   (`events-routing.module.ts` aggregates each module's `<context>.subscriptions.ts`), and
   fans each event onto the subscribing contexts' `<context>.events` queues + Redis pub/sub.
3. Each `<context>.worker.module.ts` runs a `createDomainEventConsumer` that dispatches to the
   module's handlers. `apps/api`'s `RealtimeModule` (SSE) picks up the Redis pub/sub side.
