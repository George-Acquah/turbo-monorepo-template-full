# apps/worker

## Status

Bootstrapped and boots correctly. `workers.module.ts` wires: config (`@workspace/config`,
`runtime: 'worker'`), request context (`@workspace/context`), observability/logging
(`@workspace/observability`), Redis (`@workspace/redis`), the auth-core infrastructure slice
(`@workspace/auth-core`'s `AuthCoreInfrastructureModule` — only `HASH_PORT_TOKEN`/`AUTHENTICATOR_PORT_TOKEN`,
not the full JWT/Passport `AuthCoreModule`, which this app doesn't need), BullMQ
(`QueueModule.forRoot()`), Postgres/Mongo (`@workspace/prisma`, `@workspace/mongo`), outbox
persistence (`@workspace/outbox-persistence`), and event processing (`EventsRoutingModule` —
app-local, compiles the subscription registry — plus `EventsWorkersModule` from
`@workspace/events`, which brings in `DomainEventDispatchService`/`OutboxDispatchService`/
`DispatchEngine`, each plugged into a BullMQ consumer via `createQueueConsumer` from
`@workspace/queue` rather than extending a BullMQ processor class directly).
Global exception filter/response interceptor (`@workspace/filters`, `@workspace/interceptor`)
match `apps/api`'s convention. Exposes only `GET /health`.

This app is the actual outbox-drain + domain-event-dispatch worker: `apps/api` only writes outbox
rows (via `@workspace/events`' publisher-only `EventsModule`); this app claims them, enqueues them
onto `DOMAIN_EVENTS`, and `DomainEventDispatchService` dispatches each one onto its subscribers'
queues (`DispatchEngine` + the compiled routing table) and publishes to Redis pub/sub
(`realtime:user:<id>`) for `apps/api`'s `RealtimeModule` (SSE) to relay to browsers — this app does
not itself serve SSE, that stays API-side.

### How the drain is triggered

Three schedulers, all on `OUTBOX_PROCESSOR` and all handled by `OutboxDispatchService`, which
branches on the job payload's `mode` (so they cost no extra BullMQ Worker, and therefore no extra
blocking Redis connection):

- `drain` — every 15s. A safety net, not the delivery path: `EventPublisherService` nudges the drain
  immediately after each `publish`/`publishBatch`, so normal latency is milliseconds. The nudge is
  de-duplicated by bucketing its `jobId` to the second. **Do not widen the interval without the
  nudge in place** — alone it sets the floor on realtime latency. `publishWithTransaction` cannot
  nudge (its caller owns the transaction), so those events wait for a tick.
- `reap` — every 5m. Returns rows stranded in `PROCESSING` by a worker that died mid-batch.
- `prune` — daily 03:20 UTC. Deletes `PROCESSED` rows older than 7 days.

Rows are claimed with `UPDATE ... WHERE id IN (SELECT ... FOR UPDATE SKIP LOCKED)`, which is the
only thing preventing two replicas from dispatching the same event. The claim also picks up `FAILED`
rows whose `nextRetryAt` has elapsed, so retries and fresh work share one statement. A batch that
comes back full is drained again immediately, bounded to 10 iterations / 10s.

Deliberately not wired yet: `SagaCleanupService` (`@workspace/events`) exists and is exported via
`SagaModule` but nothing schedules its timeout/retention sweep on an interval — a future addition,
not a broken one.

## Intended Direction

- Queue/runtime packages: `@workspace/queue`, `@workspace/redis`, `@workspace/events`.
- Shared contracts/constants: `@workspace/types`, `@workspace/ports`, `@workspace/constants`.
- Config: `@workspace/config`
- Observability/logging: `@workspace/observability`

## Deploying On Railway

Railway has no "worker" service type — every service is just a container. What makes this one a
worker is that **it has no public domain**. Leave Settings → Networking with only the private
`*.railway.internal` entry.

The HTTP listener in `main.ts` stays regardless: Railway's healthcheck needs an endpoint, and
`GET /health` is a deep Postgres+Redis check, so a worker that boots without its dependencies fails
the deploy instead of idling silently. Healthchecks reach it over the private network. Keeping it
private also closes `GET /metrics` (the bare unauthenticated route was removed — see
`prometheus.controller.ts`'s own comment; `/metrics/auth` now refuses with a 503 when
`GRAFANA_METRICS_*` are unset instead of the empty-credential bypass this note used to describe).

`railway.json` sets the builder (`docker/Dockerfile.Workers`), healthcheck path, restart policy, and
`numReplicas`. Two dashboard settings it cannot express: point the service's **config-as-code path**
at `apps/worker/railway.json` (a single root file can't serve two services with different
Dockerfiles), and leave **Root Directory unset** — `dockerfilePath` resolves from the build-context
root.

Use `*.railway.internal` hostnames in `DATABASE_URL`/`REDIS_URL` to keep traffic off billed egress.
Note Railway's private network is IPv6-only, and Node resolves IPv4-first, so ioredis may need
`family: 6` — that surfaces as a connection timeout, not a useful error.

### Scaling

Reach for **concurrency before replicas**. Every queue currently runs at BullMQ's default
`concurrency: 1`, so one slow handler head-of-line-blocks its queue; `createQueueConsumer` /
`createDomainEventConsumer` both accept `{ concurrency }`. Replicas are the expensive lever — each
opens ~16 Redis connections (14 BullMQ Workers each duplicate a blocking connection, plus 2 shared)
plus up to `DATABASE_POOL_MAX` Postgres connections. Keep
`(api pool x api replicas) + (worker pool x worker replicas)` under the database's `max_connections`.

Two things to know before going past one replica:

- **Scheduler churn.** Every replica's `OutboxSchedulerService.onModuleInit` upserts with
  `replace: true`, which removes then re-adds. Simultaneous boots can have one replica delete the
  scheduler another just created. End state is correct (one scheduler), but a tick can be skipped,
  and it recurs on every rolling deploy. Consider `replace: false` or a leader lock at that point.
- **Shutdown grace.** The adaptive drain can hold a job ~10s and `enableShutdownHooks()` lets BullMQ
  finish it, so keep the SIGTERM→SIGKILL window comfortably above that (Railway's default 30s is
  fine).

## Worker Conventions

- Jobs must be idempotent where possible.
- Use queue names, job names, event names, and retry policies from shared constants/contracts.
- Do not log PII, secrets, tokens, raw webhook payloads containing sensitive data, or payment details.
- Treat payment webhooks, subscription lifecycle, email delivery, reminders, and enrolment activation
  as high-risk workflows.
- Keep processors thin and move reusable business logic into services/modules.

## Testing

Add focused tests for processors, event routing, retry/idempotency behavior, and high-risk payment or
subscription jobs. Run only affected package/app checks.
