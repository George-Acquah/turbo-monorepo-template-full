---
name: add-event-handler
description: Add a new domain-event handler using the shared events/queue building blocks in packages/server/*.
---

# Add an Event Handler

## Status check first

`apps/worker` (background jobs/async processing) is still a placeholder — no `package.json`, no code.
There is no worker app today that imports and wires handlers into a running process. This skill
describes the pattern as it exists in the shared `packages/server/*` packages now; full end-to-end
wiring (a worker app that boots these modules and registers concrete handlers) is future work once
`apps/worker` is scaffolded. Don't invent app-level wiring files that don't exist.

There is also no `modules/<domain>/` DDD layer and no fees/tenancy/academics domain in this repo — if
you see instructions referencing those, they're stale.

## Real building blocks

- `packages/server/events/src/dispatch/` — the dispatch engine (`dispatch.engine.ts`), a binding
  registry (`binding.registry.ts`), a BullMQ transport adapter (`bullmq-transport.adapter.ts`), and an
  event-partition-context factory.
- `packages/server/events/src/mesh/` — transport adapter, subscription registry
  (`subscription.registry.ts`), routing compiler (`routing.compiler.ts`), and an
  events-coverage validator.
- `packages/server/events/src/sagas/` — saga orchestration (`saga-orchestrator.ts`,
  `saga-cleanup.service.ts`).
- `packages/server/events/src/processors/` — `outbox.processor.ts` (drains the outbox table and pushes
  to BullMQ) and `domain-event.processor.ts`.
- `packages/server/events/src/services/event-publisher.service.ts` — the concrete
  `EventPublisherPort` implementation use cases call to publish an event.
- `packages/server/infrastructure/queue/src/base/queue-processor.base.ts` — abstract `QueueProcessor<T>`
  base class every BullMQ processor extends (logging, hashing, idempotency hooks).
- `packages/server/infrastructure/queue/src/base/domain-event-queue-processor.base.ts` — a more
  specific base, `DomainEventQueueProcessor`, for queues carrying domain-event envelopes. It holds an
  array of `DomainEventHandler` (`{ supports(eventType): boolean; handle(event): Promise<void> }`) and
  dispatches to the first one whose `supports()` matches.

The pattern this skill covers: implement a `DomainEventHandler`, add it to a processor's `handlers`
array, and make sure the event/queue names it relies on come from shared constants.

---

## Step 1: Find or add the event type constant

Real location: `packages/server/constants/src/events/event-type.constants.ts` (event *type*
constants). There's no single root-level `events.constants.ts` — event-related constants are split
across `packages/server/constants/src/events/` (`event-type.constants.ts`,
`event-actor.constants.ts`, `event-version.constants.ts`, `event-source.constants.ts`).

Check what's already defined before adding a new constant — read the file first, don't assume a
naming convention without checking.

## Step 2: Find or confirm the queue name

Real location: `packages/server/constants/src/queue/queue-name.constants.ts` (`QueueNames`), with
`job-name.constants.ts`, `queue-priority.constants.ts`, and `retry.constants.ts` alongside it.

**Read this file before adding a new queue** — some existing entries in `QueueNames` reflect the
repo's earlier "schools platform" pivot (e.g. domain-specific queues that don't map to trading
mentorship concepts) and may be stale. Don't extend those without checking whether they're still
relevant; ask before adding a brand-new domain-specific queue rather than assuming a naming pattern
from an unrelated entry.

## Step 3: Publish from the calling code

```typescript
await this.eventPublisher.publish({
  eventType: SomeEvents.ENTITY_ACTION, // from packages/server/constants/src/events/event-type.constants.ts
  aggregateType: 'ENTITY',
  aggregateId: result.id,
  payload: result,
});
```

`EventPublisherPort` (from `@workspace/ports`) is the port; `EventPublisherService` in
`packages/server/events/src/services/event-publisher.service.ts` is the concrete implementation. It
writes an outbox record; `OutboxProcessor` (`processors/outbox.processor.ts`) later drains it onto the
BullMQ queue via `QueueBusPort`.

## Step 4: Implement the handler

```typescript
import { Injectable } from '@nestjs/common';
import type { DomainEventHandler, DomainEventEnvelope } from '@workspace/queue'; // from infrastructure/queue's base module
import { SomeEvents } from '@workspace/constants';

const SUPPORTED_EVENTS = new Set<string>([SomeEvents.ENTITY_ACTION]);

@Injectable()
export class EntityActionHandler implements DomainEventHandler {
  supports(eventType: string): boolean {
    return SUPPORTED_EVENTS.has(eventType);
  }

  async handle(event: DomainEventEnvelope<unknown>): Promise<void> {
    // handler logic
  }
}
```

Verify the actual export path/name for `DomainEventHandler` and `DomainEventEnvelope` in
`packages/server/infrastructure/queue/src/base/domain-event-queue-processor.base.ts` before importing
— confirm the package's public `src/index.ts` re-exports what you need.

## Step 5: Register the handler on a processor

A concrete processor extends `DomainEventQueueProcessor` and supplies a `handlers` array and a
`scope`. There is no existing concrete processor subclass wired into a running app yet (no worker app
exists) — if you're adding the first one for a given queue, you'll likely be creating both the
processor class and its registration, not just editing an existing `providers.ts`. Don't assume a
`providers.ts` file or app module already exists to add this to; check first.

## Step 6: Verify

Use the narrowest valid command for the package you actually changed:

```bash
pnpm --filter @workspace/events check-types      # if you touched packages/server/events
pnpm --filter @workspace/queue check-types       # if you touched packages/server/infrastructure/queue
pnpm --filter @workspace/constants check-types   # if you added/changed a constant
```

**Do not run** root `pnpm check-types` or `pnpm build`. There is currently no working `test` script in
any `packages/server/*` package (no Jest/Vitest config exists yet), despite two orphaned spec files
(`packages/server/events/test/event-publisher.service.spec.ts`,
`packages/server/infrastructure/queue/test/queue-processor.base.spec.ts`) — don't assume a `test`
script works without checking the package's `package.json` first.

## Common mistakes

- Assuming `apps/worker`, `modules/<domain>/`, or a fees/tenancy/academics domain exist — they don't.
- Publishing with a raw string instead of a typed constant from
  `packages/server/constants/src/events/event-type.constants.ts`.
- Not implementing `supports()` correctly — a handler that always returns `true` will swallow events
  meant for other handlers.
- Adding a brand-new `QueueNames` entry without first reading the existing file — some entries are
  stale carryovers from the prior pivot; don't pattern-match off them uncritically.
