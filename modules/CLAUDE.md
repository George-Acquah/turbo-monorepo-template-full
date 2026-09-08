# modules/

## What This Directory Is

One workspace package per bounded context (`modules/auth`, `modules/catalog`, `modules/billing`,
...). This is the business/application layer — it sits on top of `packages/server/ports` (contracts)
and `packages/server/infrastructure/persistence/*` (concrete adapters) and composes them into
working behaviour.

A module has **two halves in one package**:

- the **producing / HTTP half** — controllers + use-cases, composed by `{context}.module.ts`,
  imported by **apps/api**. Use-cases emit domain events as they change state.
- the **reacting / worker half** — event-handlers + a queue processor + a subscription declaration,
  composed by `{context}.worker.module.ts`, imported by **apps/worker**. Handlers react to events.

Context names match `packages/server/ports/src/database/schema/{context}` folder names exactly
(`auth`, `identity`, `catalog`, `enrolments`, `billing`, `memberships`, `learning`, `events`,
`notifications`, `files`, `audit`, `profiles`, `search`). Package name = `@workspace/{context}`.

**`modules/auth` is the reference implementation.** Copy its shape.

## Events Are Facts (read this first)

Domain events are **immutable facts** about something that already happened, defined **centrally** in
`@workspace/types` (`events/domain-events.constants.ts` + `events/payloads/{context}.ts`) — never
inside a module. That central catalog is the shared contract, and it is what makes the two rules
below possible:

- **A producer owns its events but knows nothing about consumers.** `modules/billing` emits
  `workspace.billing.payment.succeeded`; it has no idea anyone reacts.
- **A consumer reacts to an event, not to its producer.** `modules/memberships` reacts to
  `workspace.billing.payment.succeeded` by importing only the **event type + payload** from
  `@workspace/types` — never anything from `modules/billing`. It reacts to *event C*; it does not
  care who produced it.

This is why there is **no `domain/events/` folder** in a module (the old scaffold had one — it's
gone). Events live in the shared catalog; a module produces some of them and may react to any of
them.

**Payloads are versioned, not mutated.** Once a `*Payload` interface in `events/payloads/{context}.ts`
ships, its shape is frozen — a breaking change (added/removed/retyped field) mints a new event
constant + payload (`REPORT_GENERATED_V2` / `ReportGeneratedV2Payload`) instead of editing the
existing one; old consumers keep matching the old `eventType` unaffected. This is enforced by
`pnpm --filter @workspace/types check:event-schema`, which snapshots every resolved payload shape
and fails if an existing entry drifts — see `domain-events.constants.ts`'s header comment and
`packages/server/types/scripts/check-event-schema.mjs`.

## Internal Structure

```
modules/{context}/
├── package.json                 name: @workspace/{context}
├── tsconfig.json / eslint.config.mjs / tsdown.config.ts
├── src/
│   ├── index.ts                    barrel — exports BOTH roots + routes + subscriptions
│   ├── {context}.module.ts         API root      → imported by apps/api (produce)
│   ├── {context}.worker.module.ts  worker root   → imported by apps/worker (react)
│   ├── {context}.routes.ts         ModuleRoutes (HTTP path map)
│   ├── {context}.subscriptions.ts  EventSubscription — which events this module REACTS to
│   ├── {context}.produces.ts       EventType[] — which events this module PRODUCES (owns)
│   ├── domain/                     pure business logic (services/entities/value-objects) — often
│   │                               empty; NO events/ (events are central)
│   ├── application/
│   │   ├── use-cases/              one file per use-case; PRODUCE events here
│   │   ├── services/               shared cross-use-case app services (e.g. SessionIssuerService)
│   │   └── dto/                    use-case input/output shapes (NO class-validator)
│   ├── infrastructure/
│   │   └── event-handlers/         REACT to events (extend WorkspaceEventHandlerPort<K>)
│   │                               + providers.ts (handler-array DI token). No processors/
│   │                               folder — `{context}.worker.module.ts` registers a consumer
│   │                               via `createDomainEventConsumer` (`@workspace/queue`) instead.
│   └── presentation/
│       ├── controllers/            thin: read ContextPort, call a use-case, return
│       ├── dto/                    HTTP request/response shapes (class-validator)
│       └── guards/                 module-specific guards only
└── test/
    └── application/use-cases/*.spec.ts
```

Only create folders that hold real files — an empty `domain/` is fine to omit. `auth` currently has
no `domain/` (its state matches `UserPersistence` 1:1) and no `presentation/guards/` (generic guards
come from `@workspace/guards`).

## Producing events (the HTTP half)

Use-cases inject `EVENT_PUBLISHER_TOKEN` (`EventPublisherPort`, from `@workspace/ports` — already a
dependency; the token is bound globally by `EventsPublisherModule`, which apps/api imports via
`EventsModule`, so **no new dependency or module wiring is needed to produce**). The payload type is
enforced from the `eventType` you pass — pass a wrong-shaped payload and it won't compile.

**The event must be listed in `{context}.produces.ts` first.** "The module that owns the aggregate
owns the event" is enforced, not just convention: the `workspace/event-ownership` ESLint rule
(`packages/configs/eslint/rules/event-ownership.rule.ts`) reads this module's own
`{context}.produces.ts` (`export const {context}Produces: EventType[] = [...]`) and flags any
`publish(...)`/`publishWithTransaction(...)` call whose `eventType` isn't declared there — including
another context's event, since nothing else stops one module from importing and publishing a
different module's `{Context}Events` constant. See `modules/auth/src/auth.produces.ts`.

- **Inside a business transaction → `publishWithTransaction(tx, {...})`.** Writes the outbox row in
  the *same* Postgres tx as the state change, so the event and the fact are atomic. This is the
  default. See `modules/auth/src/application/use-cases/register.use-case.ts` (emits
  `auth.user.registered` in the same tx as the `User` insert).
- **No surrounding transaction → `publish({...})`.** Opens its own tx for the outbox write; eventually
  consistent with an already-committed change. See
  `modules/auth/src/application/services/session-issuer.service.ts` (emits `auth.session.created`)
  and `logout.use-case.ts` / `refresh-token.use-case.ts` (emit `auth.session.revoked`).

```ts
await this.publisher.publishWithTransaction(tx, {
  eventType: AuthEvents.USER_REGISTERED,     // from @workspace/types
  aggregateType: AggregateType.USER,         // from @workspace/constants
  aggregateId: created.id,
  userId: created.id,
  payload: { userId: created.id, email: input.email, userType: created.userType, emailVerificationRequired: false },
});
```

Prefer emitting a shared fact once from the natural producer (e.g. `SessionIssuerService` is the
single emitter of `session.created` for login/register/refresh) rather than repeating it per
use-case. Payloads must never carry PII/secrets beyond the catalog's allowlist (see
`@workspace/types` payload files).

## Reacting to events (the worker half)

The event backbone (outbox → `DomainEventProcessor` → `DispatchEngine`) fans each event onto the
`<context>.events` queues named by the subscriptions that match it. A module reacts in four small
pieces — all present in both `modules/auth` and `modules/notifications`:

1. **`{context}.subscriptions.ts`** — declare the events you react to. An exact match references
   the real event constant from the shared catalog (`AuthEvents.USER_REGISTERED`, not the literal
   string) — every `{Context}Events` object lives centrally in `@workspace/types`, so this isn't a
   foreign-module import, it's the shared vocabulary, and it's rename-safe: if the catalog value
   ever changes, this fails to compile instead of silently going stale. Wildcards (`'workspace.
   billing.*'`) stay plain strings by necessity — there's no single constant for "all of a domain."
   Don't hand-enumerate a foreign domain's events one by one where a wildcard would do.
   ```ts
   export const notificationsSubscriptions: EventSubscription = {
     name: 'notifications.reactions',
     eventPatterns: [BillingEvents.PAYMENT_SUCCEEDED],
     queues: [QueueNames.NOTIFICATIONS_EVENTS],
     priority: 'standard',
   };
   ```
2. **`infrastructure/event-handlers/*.handler.ts`** — extend `WorkspaceEventHandlerPort<K>`
   (`@workspace/ports` — the shared strongly-typed handler contract; there is no
   module-local/redefined port). `K` is the specific event type the handler reacts to, so
   `handle(event)`'s payload is narrowed automatically from `AllEventsMap` — no manual
   `payload as SomeType` cast. `supports(eventType)` gates it using the same constant. See
   `send-payment-receipt-email.handler.ts`.
3. **`infrastructure/event-handlers/providers.ts`** — a module-local `Symbol` token +
   `useFactory` that aggregates every handler into one array (NestJS has no `multi: true` — that's
   an Angular concept, not a real Nest provider feature — this hand-rolled factory is the correct
   equivalent). The processor injects the token and **never changes** as handlers are added; only
   this file grows:
   ```ts
   export const NOTIFICATIONS_EVENT_HANDLERS = Symbol('NOTIFICATIONS_EVENT_HANDLERS');
   export const notificationsEventHandlerProviders: Provider[] = [
     SendPaymentReceiptEmailHandler,
     {
       provide: NOTIFICATIONS_EVENT_HANDLERS,
       useFactory: (h: SendPaymentReceiptEmailHandler): WorkspaceEventHandlerPort[] => [h],
       inject: [SendPaymentReceiptEmailHandler],
     },
   ];
   ```
4. **No hand-written processor class.** `{context}.worker.module.ts` registers a consumer built by
   `createDomainEventConsumer(queueName, handlersToken)` (`@workspace/queue`) instead of a module
   extending `DomainEventQueueProcessor` itself. This is the one deliberate BullMQ-coupling point in
   the whole event pipeline (`@Processor`/`Job<T>`/`WorkerHost`) — confined entirely to
   `@workspace/queue`'s factory, which implements the transport-agnostic `QueueConsumerTransport`
   contract (`@workspace/ports`) as `bullMqConsumerTransport`. So modules and `@workspace/events`
   never import anything BullMQ-flavored, and a transport swap later means implementing that same
   contract in a new package, not touching every module:
   ```ts
   // notifications.worker.module.ts
   providers: [
     ...notificationsEventHandlerProviders,
     createDomainEventConsumer(QueueNames.NOTIFICATIONS_EVENTS, NOTIFICATIONS_EVENT_HANDLERS),
   ],
   ```

`{context}.worker.module.ts` imports the context's persistence module +
`QueueModule.registerQueues([{ name: QueueNames.{CONTEXT}_EVENTS }])` and provides
`...{context}EventHandlerProviders` + the generated consumer.

A module may be **worker-only** (no `{context}.module.ts` HTTP root, no routes) when there's no
identified use-case needing an endpoint yet — this used to describe the whole of
`modules/notifications`, until member/staff self-service preferences became a real HTTP need
(`GET/PATCH /v1/notification-preferences`) and it grew a producing half alongside its worker
half, following `modules/auth`'s shape. It's a useful precedent for *how* to add one: the event
handlers/subscriptions/`{context}.produces.ts` didn't change at all — only `application/use-cases/`,
`presentation/`, and `{context}.routes.ts` were added, plus a second composition root
(`NotificationsModule` for `apps/api`, alongside the existing `NotificationsWorkerModule` for
`apps/worker`) so the two halves stay independently importable. A module that's still genuinely
worker-only today should follow the *shape* notifications had before this, not assume it stays
that way forever.

## Wiring into the apps

Modules never wire themselves — the apps aggregate them, the same way for both halves:

- **apps/api** (`src/router.module.ts`): import `{Context}Module` and spread `{context}Routes.v1`
  into the route tree. Controllers stay bare `@Controller()` (no path/version) — the app owns `v1`,
  the module owns its sub-path via `{ v1: [{ path: '{context}', module: {Context}Module }] }`
  (`ModuleRoutes` from `@workspace/types/contracts`).
- **apps/worker** (`src/workers.module.ts` + `src/events-routing.module.ts`): import
  `{Context}WorkerModule` into `imports`, and add `{context}Subscriptions` to the
  `registry.registerMany([...])` call. That's the whole change — no central routing map to edit.

The runtime registry above is hand-maintained; `packages/server/events/scripts/` also auto-discovers
every `modules/{context}` package's `{context}Subscriptions` + `{context}Produces` (no list to keep
in sync) for two build-time checks: `pnpm --filter @workspace/events check:coverage` (fails on a
catalog event with zero subscribers) and `generate:topology` (regenerates
`docs/architecture/events-topology.md` — producer → event → consumer, checked in so topology changes
show up as a normal PR diff). Both require the module packages to be built first.

## Layer Rules

- **`domain/`** — pure TS, zero framework/port imports. Usually empty here (state already lives in
  the port's `*Persistence` shape). Only add entities/value-objects/services for real invariants or
  state machines that don't belong in a use-case.
- **`application/`** — use-cases (verb-named, one per file) depend only on `domain/` +
  `@workspace/ports` tokens (incl. `EVENT_PUBLISHER_TOKEN`). Never import a concrete
  persistence/infra package — that keeps them unit-testable with `@workspace/testing` mocks, no DB,
  no Nest bootstrap. `services/` = shared cross-use-case logic. `dto/` = use-case I/O (no
  class-validator).
- **`infrastructure/`** — the reacting side (`event-handlers/`) plus any adapter genuinely unique to
  this module. No `processors/` — the queue consumer is generated by `createDomainEventConsumer`
  (`@workspace/queue`), registered directly in `{context}.worker.module.ts`. Persistence itself
  lives in `@workspace/{context}-persistence`, imported by the module/worker roots — don't
  duplicate it here.
- **`presentation/`** — thin controllers reading `ContextPort` (never `req`), HTTP DTOs
  (class-validator) in `dto/`, generic guards from `@workspace/guards`.

Dependency direction: `presentation → application → domain`, with `application` reaching sideways
into `@workspace/ports`. Concrete package imports enter only through the two module roots
(`{context}.module.ts` / `{context}.worker.module.ts`).

## Enforcement

`packages/configs/eslint/base.ts`'s `buildContextBoundaryZones` auto-generates
`import/no-restricted-paths` zones the moment this directory exists (no config changes): a
`modules/{context}` package may only import its own `ports/database/schema/{context}/**`, never
another context's, and may not reach into another module's internals. The **only** sanctioned
cross-context seam is the shared event catalog in `@workspace/types` (a reacting handler importing
an event type/payload) — reacting to events is exactly how contexts integrate without coupling.

A second rule, `workspace/event-ownership` (same `base.ts`, registered as a small local plugin —
`packages/configs/eslint/rules/event-ownership.rule.ts`), enforces the producing side of that same
seam: importing another context's event to *react* to it is fine and expected; importing it to
*publish* it is not. See "Producing events" above.

## Testing

`test/` mirrors `src/`. Use-cases are the natural unit — mock the port tokens (including
`EVENT_PUBLISHER_TOKEN`) with `@workspace/testing`'s `createMock`, no DB or Nest bootstrap. See
`modules/auth/test/application/use-cases/*.spec.ts`. Event handlers are just as easy to unit test —
construct the handler directly with mocked dependencies, assert `supports()`/`handle()` — see
`modules/notifications/test/infrastructure/event-handlers/send-payment-receipt-email.handler.spec.ts`.
