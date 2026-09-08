import type { Job } from 'bullmq';
import { QueueProcessor } from './queue-processor.base';
import { WorkspaceEvent, StrictlyTypedWorkspaceEvent } from '@workspace/types/events';
import type { IdempotencyConfig } from '@workspace/types';
import { WorkspaceEventHandlerPort } from '@workspace/ports';

/**
 * Minimal domain event envelope shape.
 * Your @workspace/types DomainEvent is compatible with this shape.
 */
export type DomainEventEnvelope<TPayload = unknown> = WorkspaceEvent<TPayload> & {
  aggregateType?: string;
  aggregateId?: string;
  // Organization that owns this event — used to route SSE messages to the
  // correct per-org Redis pub/sub channel without leaking data across tenants.
  // Deprecating in favor of tenantId in tenant property
  // organizationId?: string;
  payload?: TPayload;
  metadata?: {
    correlationId?: string;
    causationId?: string;
    userId?: string;

    [k: string]: unknown;
  };
};

/**
 * Base processor for queues that contain DomainEvent envelopes and dispatch to
 * a heterogeneous array of handlers, each strongly typed to the event(s) it
 * declares via `WorkspaceEventHandlerPort<K>`. The array itself is only as
 * strong as the port's own default (`K extends EventType = EventType`) — full
 * payload narrowing happens inside each handler's own `handle()` body via its
 * concrete `K`; the cast at dispatch time below is the one unavoidable seam
 * for a runtime-routed heterogeneous array.
 *
 * Idempotency is real, not a local concern: `QueueProcessor.process()` already
 * calls `getIdempotencyConfig()` and enforces it via `IDEMPOTENCY_KEY_REPOSITORY_TOKEN`
 * before `handle()` ever runs, and calls `failIdempotency` automatically on a
 * thrown error — same mechanism `DomainEventProcessor` (the outbox-drain
 * processor) already uses. This base wires that up once, keyed on the event's
 * own `eventId`, so every domain-event processor gets it for free.
 */
export abstract class DomainEventQueueProcessor extends QueueProcessor<
  DomainEventEnvelope<unknown>
> {
  protected abstract readonly handlers: WorkspaceEventHandlerPort[];

  /**
   * Override this per module (e.g. QueueNames.NOTIFICATIONS_EVENTS).
   * Used for idempotency scope and logging context.
   */
  protected abstract readonly scope: string;

  protected override getIdempotencyConfig(
    job: Job<DomainEventEnvelope<unknown>>,
  ): IdempotencyConfig {
    const event = job.data;
    return {
      key: event.eventId,
      scope: `dispatch:${this.scope}`,
      ttlSeconds: 86400,
      userId: event.actor?.userId ?? null,
    };
  }

  protected async handle(job: Job<DomainEventEnvelope<unknown>>): Promise<void> {
    const event = job.data;
    const handler = this.handlers.find((h) => h.supports(event.eventType));

    if (!handler) {
      await this.onNoHandler(event);
      return;
    }

    // One unavoidable cast: the array is runtime-routed and heterogeneous
    // (each handler's own K narrows inside its handle() body), so the
    // dispatch boundary itself can't be statically proven sound.
    await handler.handle(event as StrictlyTypedWorkspaceEvent);
  }

  protected async onNoHandler(_event: DomainEventEnvelope): Promise<void> {
    return;
  }
}
